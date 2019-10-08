const production = 'production';
const development = 'development';

const config = {
  [development]: {
    app: {
      apiUrl: 'http://192.168.1.15:8443', // change when joining a different network
    },
    auth: {
      clientId: 'DQupUZG50i6pvR7ZeFa6qJ2tB7oGBcLh', // the id of the web server api
      audience: 'https://foodflick-dev.com', // the audience in the access token (indenteded server reciepent of access token)
      domain: 'https://foodflick-dev.auth0.com', // the domain which generated the access token
      publicKey: `-----BEGIN CERTIFICATE-----
      MIIDCTCCAfGgAwIBAgIJYGgN9y7QfgFUMA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNV
      BAMTF2Zvb2RmbGljay1kZXYuYXV0aDAuY29tMB4XDTE5MDcyMDIwMjU0M1oXDTMz
      MDMyODIwMjU0M1owIjEgMB4GA1UEAxMXZm9vZGZsaWNrLWRldi5hdXRoMC5jb20w
      ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDCDl8zCiBH69dTEtpropDS
      se3Tx2HHZ8kLiHdydBmi4RpvKXCoyHNo1V6Jq17FYlOBa25nXcSOsFCDYacowxgC
      6jSsq594oQ3L1lR0t99YPsKnPhylVTcZtUHdC0loJxwJldE3dZWlaEDO8wLcKgYy
      JbHIAZrIZiP26Lh4oq9FjIrBem4hSPIVPRW72IFWC1UwDrvNgnhyDzWooiyNBN0N
      tWmujc0i7hXNtiw7Fo1+APkhEmT/S7a4B8YVEup2+aDl07k0wV+5kej6ZCrsNp57
      ZLYQEywrXZibTAHRJRhAbPVHrLkM3uuTFT5EJFEqz5BJ/Np6bUfANLWuY0A/6Q81
      AgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFGLqh7nrRYWCYvLj
      O/BfJ2RO8kjaMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEACM/N
      85tZPqjJ2OkLjvb9JVF13gw7tp6Wnx7I4zYa2+EhZnjbdl+c8HHp/zgjZx9OrdEK
      nBgucagIrelxJV1iSJ6kfPlj6Eyd6nUZZonj7deKsFVIVvWGvmiMmZ0PJQXJuZbH
      6699AJFf6DD/E8Abe0S0JGpx0mJYeBQ8WT70Ii7NmwZivtI7XWsjZBbQ7+qTo9U9
      1eIu4eCK3PXfji2vAykQKKx7QkR2KqvK80OQtaVp77EkoFsn3o2Y53/9Pzu7Nz6h
      epyFwipmzDlomPEjrmWn+Z2BOVtPtux1W7w8RDZLasCDKdbWGSAHn6ExAanAkPVx
      GHvfjzAiLDRjG8pWVA==
      -----END CERTIFICATE-----
      `
    },
    analytics: {
      key: 'af4f17f91e955ff4a44b8c5b154bb46d', // amplitude key
    },
    stripe: {
      key: 'pk_test_Ij3KCwOSq0LycG5DEcpvULGp00kyRcst9h'
    }
  },
  [production]: {
    app: {
      apiUrl: 'https://foodflick.herokuapp.com',
    },
    auth: {
      clientId: 'm4Ckg9BXS7PbAu6X2HVATRn7Q46x4VBt',
      audience: 'https://foodflick.com',
      domain: 'https://foodflick.auth0.com',
      publicKey: `-----BEGIN CERTIFICATE-----
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
      `,
    },
    analytics: {
      key: 'af4f17f91e955ff4a44b8c5b154bb46d',
    },
    stripe: {
      key: 'pk_live_ssYCk7PkKuv7b817RsAnJnsZ00dDcwl5JM'
    }
  }
};

const getConfig = () => {
  if (process.env.NODE_ENV === production) {
    console.log('running with production config');
    return config[production];
  } else {
    console.log('running with default config');
    return config[development];
  }
};

export const activeConfig = getConfig();