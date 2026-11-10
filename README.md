# SpendWise

SpendWise is a responsive personal budgeting dashboard. Enter a monthly budget, categorized expenses, and a savings goal to see your spending totals, remaining balance, category breakdown, and savings progress.

## Technologies used

- HTML for the dashboard structure
- CSS for responsive styling and mobile navigation
- JavaScript for input validation, calculations, and rendering
- Browser local storage for saving entries on the current device

## Run locally

Open `index.html` in a modern browser. Set your own budget and savings goal, then add expenses. The dashboard starts without sample personal or financial data.

Budget information is saved in the current browser on the current device. It is not uploaded to an account or shared with other devices. Clearing the browser's site data removes it.

## GitHub repository

- Repository: [tsan47868-jpg/web-development-final-project](https://github.com/tsan47868-jpg/web-development-final-project)
- Default branch: `main`
- Visibility: public

The project files have been pushed to this repository.

## Live Netlify website

[Open the live SpendWise website](https://webdevelopmentfinalproject.netlify.app/)

## Deployment checklist

- [x] Organize the static site files for deployment.
- [x] Push the project to the public GitHub repository.
- [x] Test the dashboard locally, including budget, expense, savings, validation, and saved data.
- [x] Import the GitHub repository into Netlify and publish the site.
- [x] Set a memorable SpendWise Netlify subdomain.
- [x] Test the live site: styles and scripts load, mobile navigation works, and budget, expense, savings, and reload persistence work.
- [ ] Make a visible change, push it to GitHub, and confirm Netlify deploys it automatically.
- [ ] Submit the public GitHub repository link through the LMS.

## Deployment process

The public GitHub repository's `main` branch is deployed to Netlify at [webdevelopmentfinalproject.netlify.app](https://webdevelopmentfinalproject.netlify.app/). The site is static and is published from the repository root without a build command. The live page was tested for loading styles and scripts, mobile menu interaction, budget and expense entry, savings tracking, and persistence after reloading.

The final continuous-deployment check is still outstanding: make a visible change, push it to `main`, and confirm Netlify publishes the new version automatically. Then submit the public GitHub repository link through the LMS.

## Deployment challenges

The initial Netlify deployment and live-site checks completed without a blocking issue. Record any challenges encountered during the pending automatic-deployment test here.

## Lessons learned

The dashboard derives its totals and category breakdown from the expenses entered by the user, keeping those views consistent. Local storage preserves entries between visits in the same browser but does not synchronize between devices. Netlify serves the published static site from the GitHub repository; verify the automatic deployment after future pushes.
