"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs = require("fs");
var core = require("@actions/core");
var github = require("@actions/github");
var path = require("path");
var FormData = require("form-data");
var MAILGUN_API_KEY = core.getInput('mailgun-api-key');
var MAILGUN_DOMAIN = core.getInput('mailgun-domain');
var BASE_URL = "https://api.mailgun.net/v3/";
var commitHash = github.context.sha;
var mailsFolderPath = path.join(__dirname, 'html_templates');
var headers = {
    'Authorization': 'Basic ' + Buffer.from("api:".concat(MAILGUN_API_KEY)).toString('base64')
};
//FUNCTION TO READ ALL TEMPLATES
var loadMjmlFiles = function (folderPath) {
    var mjmlFiles = {};
    var files = fs.readdirSync(folderPath);
    files.forEach(function (file) {
        var fullPath = path.join(folderPath, file);
        var fileStat = fs.statSync(fullPath);
        if (fileStat.isFile() && path.extname(fullPath) === '.html') {
            var fileName = path.basename(fullPath, '.html');
            var fileContent = fs.readFileSync(fullPath, 'utf-8');
            mjmlFiles[fileName] = fileContent;
        }
    });
    return mjmlFiles;
};
//LOAD TEMPOLATES TO SOMETHING
var mjmlFiles = loadMjmlFiles(mailsFolderPath);
var MjmlTemplates = {};
//MAKE IBJECT WITH TEMPLATES
Object.keys(mjmlFiles).forEach(function (fileName) {
    MjmlTemplates[fileName.toUpperCase()] = fileName;
});
//GET EXISTING MAILGUN TEMPLATES
function getMailgunTemplateNames() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("".concat(BASE_URL, "/templates"), { "headers": headers })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.items];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error fetching templates:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
//SEND UPLOAD TEMPLATE REQUEST
var uploadMailgunTemplate = function (templateName, templateContent) { return __awaiter(void 0, void 0, void 0, function () {
    var form, headers_1, createTemplateResponse, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                form = new FormData();
                form.append('name', templateName);
                form.append('template', templateContent);
                form.append('tag', commitHash);
                form.append('template', 'html');
                form.append('comment', "Created by GitHub action upon pushing commit #".concat(commitHash, " to repository ").concat(github.context.repo.repo));
                headers_1 = {
                    'Authorization': 'Basic ' + Buffer.from("api:".concat(MAILGUN_API_KEY)).toString('base64')
                };
                return [4 /*yield*/, axios_1.default.post("".concat(BASE_URL).concat(MAILGUN_DOMAIN, "/templates"), form, {
                        "headers": headers_1
                    })];
            case 1:
                createTemplateResponse = _a.sent();
                console.log('Template created successfully:', createTemplateResponse.data);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error uploading template:', error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
//SEND UPDATE TEMPLATE REQUEST
var updateMailgunTemplate = function (templateName, templateContent) { return __awaiter(void 0, void 0, void 0, function () {
    var form, headers_2, createTemplateResponse, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                form = new FormData();
                form.append('name', templateName);
                form.append('template', templateContent);
                form.append('tag', commitHash);
                form.append('template', 'html');
                form.append('comment', "Updated by GitHub action upon pushing commit #".concat(commitHash, " to repository ").concat(github.context.repo.repo));
                headers_2 = {
                    'Authorization': 'Basic ' + Buffer.from("api:".concat(MAILGUN_API_KEY)).toString('base64')
                };
                return [4 /*yield*/, axios_1.default.post("".concat(BASE_URL).concat(MAILGUN_DOMAIN, "/templates/").concat(templateName, "/versions"), form, {
                        "headers": headers_2
                    })];
            case 1:
                createTemplateResponse = _a.sent();
                console.log('Template created successfully:', createTemplateResponse.data);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error uploading template:', error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
//LOAD
Object.entries(mjmlFiles).forEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var enumKey, enumValue, mailgunTemplateNames;
    var templateName = _b[0], templateContent = _b[1];
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                enumKey = templateName.toUpperCase();
                enumValue = MjmlTemplates[enumKey];
                return [4 /*yield*/, getMailgunTemplateNames()];
            case 1:
                mailgunTemplateNames = _c.sent();
                if (enumValue) {
                    if (mailgunTemplateNames.includes(templateName)) {
                        updateMailgunTemplate(enumValue, templateContent);
                    }
                    else {
                        uploadMailgunTemplate(enumValue, templateContent);
                    }
                }
                else {
                    console.warn("Template \"".concat(templateName, "\" is not defined in MjmlTemplates. Skipping upload."));
                }
                return [2 /*return*/];
        }
    });
}); });
