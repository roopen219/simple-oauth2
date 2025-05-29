const createApplication = require("./");
const { AuthorizationCode } = require("./../");

createApplication(({ app, callbackUrl }) => {
  const client = new AuthorizationCode({
    client: {
      id: "63aaef06dda5a25e37ba810b",
      secret: "9jqrt4xx0u9nci7xbdec539z9cseua7u27cehn6j",
      idParamName: "client_id",
      secretParamName: "client_secret",
    },
    auth: {
      tokenHost: `https://truto.gorgias.com`,
    },
    options: {
      authorizationMethod: "header",
      bodyFormat: "form",
    },
  });

  // Authorization uri definition
  const authorizationUri = client.authorizeURL({
    redirect_uri: `${callbackUrl}?account=acme`,
    scope: "users:read",
    state: "random_state",
    access_type: "offline",
  });

  // Initial page redirecting to Github
  app.get("/auth", (req, res) => {
    console.log(authorizationUri);
    res.redirect(authorizationUri);
  });

  // Callback service parsing the authorization token and asking for the access token
  app.get("/callback", async (req, res) => {
    const { code } = req.query;
    const options = {
      code,
      redirect_uri: `${callbackUrl}?account=acme`,
    };

    try {
      const accessToken = await client.getToken(options);

      console.log("The resulting token: ", accessToken.token);

      return res.status(200).json(accessToken.token);
    } catch (error) {
      console.error("Access Token Error", error.message);
      return res.status(500).json("Authentication failed");
    }
  });

  app.get("/", (req, res) => {
    res.send('Hello<br><a href="/auth">Log in with Github</a>');
  });
});
