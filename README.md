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

**Status:** Not deployed yet. Add the published Netlify URL here after deployment and testing.

## Deployment checklist

- [x] Organize the static site files for deployment.
- [x] Push the project to the public GitHub repository.
- [x] Test the dashboard locally, including budget, expense, savings, validation, and saved data.
- [ ] Import the GitHub repository into Netlify and publish the site.
- [ ] Set a memorable SpendWise Netlify subdomain.
- [ ] Make a visible change, push it to GitHub, and confirm Netlify deploys it automatically.
- [ ] Test the live site and confirm its HTML, styles, scripts, navigation, and budgeting features work.
- [ ] Add the final live Netlify URL to this README.
- [ ] Submit the public GitHub repository link through the LMS.

## Deployment process

1. In Netlify, create a new site by importing `tsan47868-jpg/web-development-final-project` from GitHub and select the `main` branch.
2. This is a static site: use the repository root as the publish directory and leave the build command empty.
3. Deploy the site, then choose a memorable site name in Netlify's site settings.
4. Open the Netlify URL and test the layout, mobile navigation, adding a budget, adding an expense, setting a savings goal, validation, and persistence after reloading the same browser.
5. Make a small visible update to the site, commit and push it to `main`, and verify that Netlify automatically completes a new deployment with the change.
6. Test the updated published site, replace the Netlify URL placeholder above with the working URL, and submit this public GitHub repository link through the LMS.

## Deployment challenges

Netlify deployment has not been completed, so deployment-specific challenges or outcomes cannot yet be reported. Record any issues encountered during the first deployment or automatic-deployment test here after resolving them.

## Lessons learned

The dashboard derives its totals and category breakdown from the expenses entered by the user, keeping those views consistent. Local storage preserves entries between visits in the same browser but does not synchronize between devices. The GitHub repository is ready for Netlify; the live deployment and continuous-deployment check are still outstanding.
