import jwtUtil from 'jsonwebtoken';

const PUBLIC_KEY = `-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIJLREMbwE8DeepMA0GCSqGSIb3DQEBCwUAMB4xHDAaBgNV
BAMTE2Zvb2RmbGljay5hdXRoMC5jb20wHhcNMTgwMjAyMjIzMjA0WhcNMzExMDEy
MjIzMjA0WjAeMRwwGgYDVQQDExNmb29kZmxpY2suYXV0aDAuY29tMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxNuO8QYUqRESqXaEzNdSxH+Jvs0d7l4N
oVzZENIw0/D0AdF75CdYB2+Mi7Xz/WO8iZfGEeoyjXTG4RNERFiUL99Bi8GgjieI
nimyFJH7db0ddiVQpcLDoIbgF0+PQH6PtAePKdXsfqQB2pT9w7nBYksLJerP333a
ZcxQps1rt9hKm4W03pdrEz+xSZj9sWB6Wf4molPZyfESPBROlw4dk2Dj63GANvgc
XoGoBrORgRRoaJnAORPXPJezkViBjTFDc0pEwCBBEI3/lVtp/JbozWJaqu3tfQCr
5w7oyj8/tP5MiwJPGpjLg9bnw6B4pBrWfXwMP3m3kTrqupvE/W3cIwIDAQABo0Iw
QDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRznsMCp6w8rkifGSAjan9qppUM
YTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAErwXe9nKeAi97MK
w180YFqmeNSZte8dm7RzPvw1iUsAN1QF5gToGmvxHXwpuBAZs0aE7M89KyOWqmEw
v1IiUjrem/VR0n4Saa1LkB/AKXb9x/O7QeZxfkEV/LE0W1z5XU2ZrWQZuyLfKkdu
aQx4EHqH/bQYY/91mOWJB/UYmReDpmZ5xNKXLnU05fX5CF8W3OFwpdk0Eg08r8++
m276/KnLks6VjskEbEhyAj8vYIrXI591DBRsNDH4mffOKUJdKT0MP4Ze17tu0mPC
HH5LD0RE9irb3gEn+BFMOd2JyMbddf2HiFIiPErw+LhDoWr2jpmFc6tIieDm8Fcj
CAXO0dg=
-----END CERTIFICATE-----
`;

export const MANAGER_PERM = 'write:rests';

export const getSignedInUser = ({headers: { authorization }}) => {
  if (!authorization || authorization === 'undefined') {
    return null;
  }

  let user = null;
  const namespace = 'https://foodflick.com/';
  //todo 2 assume bearer token for now.
  const jwt = authorization.replace('Bearer ', '');
  try {
    //throws error is verification fails
    const claims = jwtUtil.verify(jwt, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer : 'https://foodflick.auth0.com/',
      audience: 'https://foodflick.com',
    });
    user = {
      //remove identity provider because auth0 id does't include it
      _id: claims.sub,
      email: claims[namespace + 'email'],
      stripeId: claims[namespace + 'stripeId'],
      perms: claims.scope.includes(MANAGER_PERM) ? [MANAGER_PERM] : []
    }
  
  } catch (e) {
    //todo 1: error handle
    console.error('BAD TOKEN', e, jwt);
    throw e;
  }

  return user;
}