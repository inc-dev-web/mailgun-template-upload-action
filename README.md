# mailgun-template-upload-action

GitHub Action for updating and uploading (if template with this name not found) mailgun templates using mailgun API.

## Usage

1. Create an Mailgun API token with the Mailgun Dashboard.
2. Add that API token as a secret to your GitHub repository, `MAILGUN_API_KEY`.
3. Create a `.github/workflows/update_templates.yml` file in your repository:

   ```yml
      on:
        push:
          branches:
            - main
      jobs:
        update_mail_templates:
          runs-on: ubuntu-latest
          name: Update Mailgun templates
          steps:

            - name: Checkout repository
              uses: actions/checkout@v2

            - name: Upload templates
              uses: inc-dev-web/mailgun-template-upload-action@v1
              with:
                #path to folder with templates in your repository, example: '${{ github.workspace }}/html_templates'
                templates-folder-path: YOUR_PATH_TO_TEMPLATES_FOLDER 
                mailgun-host: 'api.eu.mailgun.net'
                #your mailgun api key stored in github secrets
                mailgun-api-key: ${{ secrets.MAILGUN_API_KEY }}
                mailgun-domain: YOUR_MAILGUN_DOMAIN
   ```

4. Replace `YOUR_PATH_TO_TEMPLATES_FOLDER` and `YOUR_MAILGUN_DOMAIN` with the appropriate values to your project.

