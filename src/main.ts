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

//READ ALL TEMPLATES FUNCTION
const loadHtmlFiles = (folderPath: string): Record<string, string> => {
    const htmlFiles: Record<string, string> = {};
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const fullPath = path.join(folderPath, file);
        const fileStat = fs.statSync(fullPath);

        if (fileStat.isFile() && path.extname(fullPath) === '.html') {
            const fileName = path.basename(fullPath, '.html');
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            htmlFiles[fileName] = fileContent;
        }
    });

    return htmlFiles;
};

//LOAD HTML TEMPLATES
const htmlFiles = loadHtmlFiles(TEMPLATES_FOLDER_PATH);

const HtmlTemplates: Record<string, string> = {};

//MAKE OBJECT WITH TEMPLATES
Object.keys(htmlFiles).forEach(fileName => {
    HtmlTemplates[fileName.toUpperCase()] = fileName;
});

//GET EXISTING MAILGUN TEMPLATES
async function getMailgunTemplateNames() {
    try {
        const response = await axios.get(`${BASE_URL}${MAILGUN_DOMAIN}/templates`,
            { "headers": headers }
        );
        const templateNames = response.data.items.map((template: { name: string; }) => template.name);
        return templateNames;
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
        form.append('tag', commitHash);
        form.append('template', 'html');
        form.append('comment', `Created by GitHub action upon pushing commit #${commitHash} to repository ${github.context.repo.repo}`);
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
        console.error('Error uploaded template:', error as any);
    }
};

//SEND UPDATE TEMPLATE REQUEST
const updateMailgunTemplate = async (templateName: string, templateContent: string) => {
    try {
        const form = new FormData();
        form.append('name', templateName);
        form.append('template', templateContent);
        form.append('tag', commitHash);
        form.append('template', 'html');
        form.append('comment', `Updated by GitHub action upon pushing commit #${commitHash} to repository ${github.context.repo.repo}`);
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
        };

        const createTemplateResponse = await axios.post(`${BASE_URL}${MAILGUN_DOMAIN}/templates/${templateName}/versions`,
            form,
            {
                "headers": headers
            }
        );

        console.log('Template updated successfully:', createTemplateResponse.data);
        await setActiveTemplateVersion(templateName, commitHash);
    } catch (error) {
        console.error('Error updating template:', error as any);
    }
};

// SET NEW VERSION AS ACTIVE
const setActiveTemplateVersion = async (templateName: string, versionTag: string) => {
    try {
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
        };

        await axios.put(`${BASE_URL}${MAILGUN_DOMAIN}/templates/${templateName}/versions/${versionTag}`,
            { active: true },
            { headers }
        );

        console.log(`Template version ${versionTag} is now active.`);
    } catch (error) {
        console.error('Error activating template version:', error as any);
    }
};

//LOAD
Object.entries(htmlFiles).forEach(async ([templateName, templateContent]) => {
    const enumKey = templateName.toUpperCase();
    const enumValue = HtmlTemplates[enumKey];
    const mailgunTemplateNames = await getMailgunTemplateNames();

    if (enumValue) {
        if (mailgunTemplateNames.includes(templateName)) {
            updateMailgunTemplate(enumValue, templateContent);
        }
        else {
            uploadMailgunTemplate(enumValue, templateContent);
        }
    } else {
        console.warn(`Template "${templateName}" is not defined in HtmlTemplates. Skipping upload.`);
    }
});
