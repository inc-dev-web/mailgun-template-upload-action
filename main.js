"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var import_axios = __toESM(require("axios"));
var fs = __toESM(require("fs"));
var core = __toESM(require("@actions/core"));
var github = __toESM(require("@actions/github"));
var path = __toESM(require("path"));
var FormData = require("form-data");
var MAILGUN_API_KEY = core.getInput("mailgun-api-key");
var MAILGUN_DOMAIN = core.getInput("mailgun-domain");
var TEMPLATES_FOLDER_PATH = core.getInput("templates-folder-path");
var BASE_URL = `https://api.mailgun.net/v3/`;
var commitHash = github.context.sha;
var headers = {
  "Authorization": "Basic " + Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")
};
var loadHtmlFiles = (folderPath) => {
  const htmlFiles2 = {};
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const fullPath = path.join(folderPath, file);
    const fileStat = fs.statSync(fullPath);
    if (fileStat.isFile() && path.extname(fullPath) === ".html") {
      const fileName = path.basename(fullPath, ".html");
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      htmlFiles2[fileName] = fileContent;
    }
  });
  return htmlFiles2;
};
var htmlFiles = loadHtmlFiles(TEMPLATES_FOLDER_PATH);
var HtmlTemplates = {};
Object.keys(htmlFiles).forEach((fileName) => {
  HtmlTemplates[fileName.toUpperCase()] = fileName;
});
async function getMailgunTemplateNames() {
  try {
    const response = await import_axios.default.get(
      `${BASE_URL}${MAILGUN_DOMAIN}/templates`,
      { "headers": headers }
    );
    const templateNames = response.data.items.map((template) => template.name);
    return templateNames;
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
}
var uploadMailgunTemplate = async (templateName, templateContent) => {
  try {
    const form = new FormData();
    form.append("name", templateName);
    form.append("template", templateContent);
    form.append("tag", commitHash);
    form.append("template", "html");
    form.append("comment", `Created by GitHub action upon pushing commit #${commitHash} to repository ${github.context.repo.repo}`);
    const headers2 = {
      "Authorization": "Basic " + Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")
    };
    const createTemplateResponse = await import_axios.default.post(
      `${BASE_URL}${MAILGUN_DOMAIN}/templates`,
      form,
      {
        "headers": headers2
      }
    );
    console.log("Template created successfully:", createTemplateResponse.data);
  } catch (error) {
    console.error("Error uploaded template:", error);
  }
};
var updateMailgunTemplate = async (templateName, templateContent) => {
  try {
    const form = new FormData();
    form.append("name", templateName);
    form.append("template", templateContent);
    form.append("tag", commitHash);
    form.append("template", "html");
    form.append("comment", `Updated by GitHub action upon pushing commit #${commitHash} to repository ${github.context.repo.repo}`);
    const headers2 = {
      "Authorization": "Basic " + Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")
    };
    const createTemplateResponse = await import_axios.default.post(
      `${BASE_URL}${MAILGUN_DOMAIN}/templates/${templateName}/versions`,
      form,
      {
        "headers": headers2
      }
    );
    console.log("Template updated successfully:", createTemplateResponse.data);
  } catch (error) {
    console.error("Error updating template:", error);
  }
};
Object.entries(htmlFiles).forEach(async ([templateName, templateContent]) => {
  const enumKey = templateName.toUpperCase();
  const enumValue = HtmlTemplates[enumKey];
  const mailgunTemplateNames = await getMailgunTemplateNames();
  if (enumValue) {
    if (mailgunTemplateNames.includes(templateName)) {
      updateMailgunTemplate(enumValue, templateContent);
    } else {
      uploadMailgunTemplate(enumValue, templateContent);
    }
  } else {
    console.warn(`Template "${templateName}" is not defined in HtmlTemplates. Skipping upload.`);
  }
});
