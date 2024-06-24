import axios from 'axios';
import * as fs from 'fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'path';
import FormData = require('form-data');


//TODO: MOVE TO GITHUB ACTIONS

//const MAILGUN_API_KEY = '***REMOVED***';
//const MAILGUN_DOMAIN = '***REMOVED***';

const MAILGUN_API_KEY = core.getInput('mailgun-api-key');
const MAILGUN_DOMAIN = core.getInput('mailgun-domain');

const commitHash = github.context.sha;

const mailsFolderPath = path.join(__dirname, 'html_templates');

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
const mjmlFiles = loadMjmlFiles(mailsFolderPath);

const MjmlTemplates: Record<string, string> = {};

//MAKE IBJECT WITH TEMPLATES
Object.keys(mjmlFiles).forEach(fileName => {
    MjmlTemplates[fileName.toUpperCase()] = fileName;
});


//TODO:
//html_templates MJML TO MAILGUN READEBLE TYPE RIGHT BEFORE SENDING
//LOAD FUNCION
const uploadTemplateToMailgun = async (templateName: string, templateContent: string) => {
    try {
        const form = new FormData();
        form.append('name', templateName);
        form.append('template', templateContent);
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')
        };

        const createTemplateResponse = await axios.post(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/templates`,
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
Object.entries(mjmlFiles).forEach(([templateName, templateContent]) => {
    const enumKey = templateName.toUpperCase();
    const enumValue = MjmlTemplates[enumKey];

    if (enumValue) {
        uploadTemplateToMailgun(enumValue, templateContent);
    } else {
        console.warn(`Template "${templateName}" is not defined in MjmlTemplates. Skipping upload.`);
    }
});
