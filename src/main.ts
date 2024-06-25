import axios from 'axios';
import * as fs from 'fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'path';
import FormData = require('form-data');


const MAILGUN_API_KEY = core.getInput('mailgun-api-key');
const MAILGUN_DOMAIN = core.getInput('mailgun-domain');
const TEMPLATES_FOLDER_PATH = core.getInput('templates-folder-path')
const BASE_URL = `https://api.mailgun.net/v3/`;
const commitHash = github.context.sha;

const headers = {
    'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
};

//FUNCTION TO READ ALL TEMPLATES
const loadMjmlFiles = (folderPath: string): Record<string, string> => {
    const mjmlFiles: Record<string, string> = {};
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const fullPath = path.join(folderPath, file);
        const fileStat = fs.statSync(fullPath);

        if (fileStat.isFile() && path.extname(fullPath) === '.html') {
            const fileName = path.basename(fullPath, '.html');
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            mjmlFiles[fileName] = fileContent;
        }
    });

    return mjmlFiles;
};

//LOAD TEMPOLATES TO SOMETHING
const mjmlFiles = loadMjmlFiles(TEMPLATES_FOLDER_PATH);

const MjmlTemplates: Record<string, string> = {};

//MAKE IBJECT WITH TEMPLATES
Object.keys(mjmlFiles).forEach(fileName => {
    MjmlTemplates[fileName.toUpperCase()] = fileName;
});

//GET EXISTING MAILGUN TEMPLATES
async function getMailgunTemplateNames(){
    try {
        const response = await axios.get(`${BASE_URL}/templates`,
            { "headers": headers }
        );
        return response.data.items;
    } catch (error) {
        console.error('Error fetching templates:', error);
    }
}

//SEND UPLOAD TEMPLATE REQUEST
const uploadMailgunTemplate = async (templateName: string, templateContent: string) => {
    try {
        const form = new FormData();
        form.append('name', templateName);
        form.append('template', templateContent);
        form.append('tag',commitHash);
        form.append('template','html');
        form.append( 'comment', `Created by GitHub action upon pushing commit #${commitHash} to repository ${github.context.repo.repo}`);
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
        };

        const createTemplateResponse = await axios.post(`${BASE_URL}${MAILGUN_DOMAIN}/templates`,
            form,
            {
                "headers": headers
            }
        );

        console.log('Template created successfully:', createTemplateResponse.data);
    } catch (error) {
        console.error('Error uploading template:', error as any);
    }

};

//SEND UPDATE TEMPLATE REQUEST
const updateMailgunTemplate  = async (templateName: string, templateContent: string) => {
    try {
        const form = new FormData();
        form.append('name', templateName);
        form.append('template', templateContent);
        form.append('tag',commitHash);
        form.append('template','html');
        form.append( 'comment', `Updated by GitHub action upon pushing commit #${commitHash} to repository ${github.context.repo.repo}`);
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
        };

        const createTemplateResponse = await axios.post(`${BASE_URL}${MAILGUN_DOMAIN}/templates/${templateName}/versions`,
            form,
            {
                "headers": headers
            }
        );

        console.log('Template created successfully:', createTemplateResponse.data);
    } catch (error) {
        console.error('Error uploading template:', error as any);
    }

};

//LOAD
Object.entries(mjmlFiles).forEach(async([templateName, templateContent]) => {
    const enumKey = templateName.toUpperCase();
    const enumValue = MjmlTemplates[enumKey];
    const mailgunTemplateNames = await getMailgunTemplateNames();

    if (enumValue) {
        if (mailgunTemplateNames.includes(templateName)) {
            updateMailgunTemplate(enumValue, templateContent);
        }
        else{
            uploadMailgunTemplate(enumValue, templateContent);
        }
    } else {
        console.warn(`Template "${templateName}" is not defined in MjmlTemplates. Skipping upload.`);
    }
});
