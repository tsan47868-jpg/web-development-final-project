# SpendWise

SpendWise is a responsive personal budgeting dashboard. Enter a monthly budget, categorized expenses, and a savings goal to see your spending totals, remaining balance, category breakdown, and savings progress.

## Technologies used

- HTML for the dashboard structure
- CSS for responsive styling and mobile navigation
- JavaScript and the Web Crypto API for local account sign-in, encrypted budget storage, validation, calculations, and rendering
- Browser local storage for account records on the current device

## Run locally

Open the deployed site over HTTPS or run it from localhost in a modern browser that supports the Web Crypto API. Create a device-only account, then set your own budget and savings goal and add expenses. The dashboard starts without sample personal or financial data.

Accounts are local to the browser and device; they are not online accounts and cannot be used to sign in on another device. Budget data is encrypted in browser storage using a key derived from the account password. The password itself is not saved. There is no password reset or recovery; losing the password or clearing browser site data can make the budget unrecoverable. This client-side account is not a substitute for server-backed authentication.

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
- [ ] Deploy and test the device-only sign-up/sign-in and encrypted budget changes.
- [ ] Make a visible change, push it to GitHub, and confirm Netlify deploys it automatically.
- [ ] Submit the public GitHub repository link through the LMS.

## Deployment process

The public GitHub repository's `main` branch is deployed to Netlify at [webdevelopmentfinalproject.netlify.app](https://webdevelopmentfinalproject.netlify.app/). The site is static and is published from the repository root without a build command. The live page was tested for loading styles and scripts, mobile menu interaction, budget and expense entry, savings tracking, and persistence after reloading.

The final continuous-deployment check is still outstanding: make a visible change, push it to `main`, and confirm Netlify publishes the new version automatically. Then submit the public GitHub repository link through the LMS.

## Deployment challenges

The initial Netlify deployment and live-site checks completed without a blocking issue. Record any challenges encountered during the pending automatic-deployment test here.

## Lessons learned

The dashboard derives its totals and category breakdown from the expenses entered by the user, keeping those views consistent. Device-only accounts encrypt budgets in the current browser but do not synchronize between devices and do not provide password recovery. Netlify serves the published static site from the GitHub repository; verify the automatic deployment after future pushes.
