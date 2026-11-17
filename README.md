# Nostelle Fragrances — By Peejay's Luxury

Botanical fragrance storefront featuring interactive WebGL shaders, 60fps canvas motion films, flacon customization, Paystack (`NGN`) checkout, and live order tracking.

## Deploying to GitHub Pages

1. Export or push this project to a GitHub repository on the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Nostelle Fragrances"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In your GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. To enable live Paystack payments, open **Settings → Secrets and variables → Actions** and add a repository secret named `VITE_PAYSTACK_PUBLIC_KEY` with your Paystack public key (`pk_test_...` or `pk_live_...`), then re-run the workflow.
