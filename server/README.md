# Getting started
1) set some environment variables for various api keys
  ```
  STRIPE_KEY = <find keys at https://dashboard.stripe.com/test/apikeys. be sure to toggle "Viewing test data">
  GEO_KEY = <find it at https://dash.geocod.io/apikey# (foodflick-dev)>
  AUTH_CLIENT_SECRET= <find it at https://manage.auth0.com/dashboard/us/foodflick-dev/applications/qRQfx9y16RUYns9KmTDalrhXzs2iAEhA/settings>
  ```
2) install ElasticSearch
   1) If installing in mac, make sure you add elasticsearch to your path via the `.bash_profile`. To access `.bash_profile` you first need to enable hidden folders. (google this). Then go to your home directory and open a new file called `.bash_profile`. Then add the following lines, substuting paths for your own. Save the file.
  ```
export ANDROID_HOME=$HOME/Library/Android/sdk
export ELASTIC_HOME=$HOME/elasticsearch-6.5.4/bin
export KIBANA_HOME=$HOME/kibana-6.5.4-darwin-x86_64/bin
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ELASTIC_HOME
export PATH=$PATH:$KIBANA_HOME
  ```
3) install kibana
   1) If installing in mac, make sure you add kibana to your path via the `.bash_profile`. See above.
4) `npm install`
5) When you download elasticsearch set the repo path to some location. If you installed via an .msi (windows) then the installer provides you an input to choose your repo path. If you installed via a tar file (mac) then go to whereever you unzipped the folder and go to the bin folder. Inside the bin folder is a `elasticsearch.yml`. Scroll down in this file and edit the repo path to your own path.
6) run in terminal, `elasticsearch`
7) in a different tab, run `kibana`
8) in a different tab, once elasticsearch is finished, `npm run dev`
9) Open the kibana console via `http://localhost:5601/app/kibana#/dev_tools/console` in your browser. On the left side, paste and run the following command to verify that the repo is what you set it as.

    `GET /_nodes/settings`

9)  Create a foodflick folder in your elasticsearch repo via kibana by running this command

```
#create repo (directory to hold snaps)
PUT /_snapshot/foodflick
{
    "type": "fs",
    "settings": {
        "location": "foodflick"
    }
}
```
11)  Then take the foodflick.zip file in this repo's doc folder and unzip it into your elastic repo, overwriting the existing foodflick folder.
12)  Restore the snapshot via kibana using the following command

`POST /_snapshot/foodflick/all/_restore`
13) Verify your index exists with the following command. You should get restaurant data.

```
GET /rests/_search?
{
    "query" : {
        "match_all" : {}
    }
}
```

# Testing 
To test an api, download the chrome extension "Modify Headers."

Go to

>localhost:3000/graphiql

Log in from the mobile app and get a access token. You can get an access token after logging in by examining the redux output in react debugger. Expand hte SIGN_IN action -> signedInUser -> token.

Open chrome and use the headers extension to add the following header. Make sure you remove the quotes.

| HEADER NAME      | VALUE |
| ----------- | ----------- |
| Authorization   | Bearer \<TOKEN HERE\>        |

Then test your api with any of the queries in the test folder (they may be out of date and require shape changes). If you download the graphql extension in vscode you can view these files with syntax highlighting