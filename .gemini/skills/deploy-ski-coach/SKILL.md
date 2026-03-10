---
name: deploy-ski-coach
description: "A standard workflow to commit, build, and deploy new updates to the Ski Coach App. Use when the user asks to deploy, update, or push changes for this project."
---

# Deploy Ski Coach App

This skill codifies the standard procedure for committing and deploying new changes to the Ski Coach App.

## Workflow

1.  **Confirm Changes**: Ask the user for a short, descriptive commit message for the changes they want to deploy.
2.  **Add and Commit**:
    -   Run `git add .` to stage all changes.
    -   Run `git commit -m "Your commit message"` using the message from the user.
3.  **Push to GitHub**:
    -   Run `git push origin main`.
4.  **Deploy to Cloud Run**:
    -   Run `gcloud run deploy ski-coach-app --source . --region us-central1 --project=eliottappfrontend --allow-unauthenticated`.
5.  **Confirm Success**: Inform the user that the deployment is complete and the new version is live.
