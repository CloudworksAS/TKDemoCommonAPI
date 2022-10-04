var express = require('express');
var app = express();
var { expressjwt: jwt } = require("express-jwt");
const jwtScope = require('express-jwt-scope')
var jwks = require('jwks-rsa');

var port = process.env.PORT || 8080;

var jwtCheck = jwt({
      secret: jwks.expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: 'https://labs-nahvinden.us.auth0.com/.well-known/jwks.json'
    }),
    audience: 'https://main-api',
    issuer: 'https://labs-nahvinden.us.auth0.com/',
    algorithms: ['RS256']
});

const customerIdRequired = (req, res, next) => {
    if (!req.auth.customerId) res.status(403).send('customerId missing in token')
    req.customerId = req.auth.customerId
    next()
}

const jwtScopeUserContext = (allowScopes, options = {}) => {
    return (req, res, next) => {
        const error = res => {
            const err_message = 'userId missing in token';

            //  Forward errors to next instead of ending the response directly
            if (options && options.errorToNext)
                return next({statusCode: 403, error: 'Forbidden', message: err_message});

            res.status(403).send(err_message);
        };

        jwtScope(allowScopes, options)(req, res, function() {
            if (!req.auth.userId) return error(res)
            next()
        })
    }
}

app.use(jwtCheck);
app.use(customerIdRequired);



app.get('/authorized', function (req, res) {
    console.log(req.auth)
    res.send(`Secured Resource accessable for customerId=${req.customerId}`);
});


app.get('/projects', jwtScope('projects:read projects:write'), async function (req, res) {
    res.json(await collection.find().toArray())
})


app.get('/myprojects', jwtScopeUserContext('myprojects:read myprojects:write'), async function (req, res) {
    const userId = req.auth.userId
    const projection = { '_id': 0, 'name': 1 }
    const query = { owner: { $eq: userId }}
    res.send(`userId ${userid}`)
    res.json(await collection.find(query, projection).toArray())
})


app.listen(port);