echo "Deploying to gh-pages"

echo "Preparing gh-pages branch"
rm -rf .temp-deploy
mkdir .temp-deploy
cd .temp-deploy

echo "Cloning gh-pages branch"
git clone --branch gh-pages https://github.com/moloxe/tina.git .

echo "Copying files to gh-pages branch"
rm -rf *
cp -r ../dist/* .

# Jekyll ignores files and folders that start with an underscore or a dot
touch .nojekyll

echo "Adding new files to gh-pages branch"
git add .
git commit -m "Deploying to gh-pages"
git push origin gh-pages

echo "Cleaning up"
cd ../
rm -rf .temp-deploy

echo "Deployment complete"
