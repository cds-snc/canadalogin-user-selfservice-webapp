sequenceDiagram
  participant User_Agent_Browser as User_Agent_Browser
  participant RP_Geo as RP_Geo
  participant Frontend_React as Frontend_React
  participant Backend_Python as Backend_Python
  box rgba(70,148,73) IBM Verify APIs
  participant IBM_Verify_AuthEP as IBM_Verify_AuthEP
  participant IBM_Verify_LoginEP as IBM_Verify_LoginEP
  participant IBM_Verify_SMSOTPEP as IBM_Verify_SMSOTPEP
  participant IBM_Verify_TokenEP as IBM_Verify_TokenEP
  participant IBM_Verify_IntrospectEP as IBM_Verify_IntrospectEP
  end

  Backend_Python ->> IBM_Verify_TokenEP: POST /token wuth client_id, client_secret, grant_type=client_credentials
  IBM_Verify_TokenEP ->> Backend_Python: Return access token, type bear.
  Note left of IBM_Verify_TokenEP:  Backend_Python is a server side app, it accesses IBM Verify APIs in this use case using this access token.
  User_Agent_Browser ->> RP_Geo: Click GC Sign In
  RP_Geo ->> Frontend_React: Redirect to GET IBM Verify /authorize&response_type=code&client_id=RP_Geo_Client_ID&redirect_uri=RP_Geo_LandingPage
  Note right of Frontend_React:  to support passkey, Browser (front end) need interact with IBM Verify EP directly.
  Frontend_React ->> IBM_Verify_AuthEP: follow redirect to /authorize
  IBM_Verify_AuthEP ->> Frontend_React: Forward to Frontend GC Sign In for Resource Owner to login
  Note left of IBM_Verify_AuthEP:  Need configure IBM Verify to redirect resource owner to GC Sign In (Frontend-React) as its login form.
  Frontend_React ->> User_Agent_Browser: Display GC Sign In Page
  User_Agent_Browser ->> Frontend_React: Resource owner enters userid-pwd
  Frontend_React ->> Backend_Python: login with userid-pwd as the primary authentication against default id source.
  Backend_Python ->> IBM_Verify_LoginEP: login with userid-pwd as the primary authentication against default id source.
  Note left of IBM_Verify_AuthEP:  Against default Identity Source.
  IBM_Verify_LoginEP ->> Backend_Python: login success with userid-pwd with response
  Backend_Python ->> Frontend_React: login success with userid-pwd with response
  Note left of IBM_Verify_AuthEP:  Frontend_React needs be able to parse the response and dynamcially route next AA sequence.
  Frontend_React ->> Backend_Python: Get the 2FA options the resource owner has regiestered with IBM Verify.
  Backend_Python ->> IBM_Verify_SMSOTPEP: Retrieve the 2FA options the resource owner has regiestered with IBM Verify.
  IBM_Verify_SMSOTPEP ->> Backend_Python: Return the 2FA options the resource owner has regiestered with IBM Verify.
  Backend_Python ->> Frontend_React: Return the 2FA options the resource owner has regiestered with IBM Verify.
  Frontend_React ->> User_Agent_Browser: Present 2FA Option form with Registered 2FA methods.
  User_Agent_Browser ->> Frontend_React: Select the OPT Option. 
  Frontend_React ->> User_Agent_Browser: Present the Verification form for the selected OPT Option. 
  User_Agent_Browser ->> Frontend_React: Click Send SMS Code.
  Frontend_React ->>   Backend_Python: Instruct to Generate SMS OTP code.
  Backend_Python ->>   IBM_Verify_SMSOTPEP: Instruct to Generate SMS OTP code.
  IBM_Verify_SMSOTPEP ->>   Backend_Python: SMS OTP successfully generated and sent.
  Backend_Python ->> Frontend_React: SMS OTP successfully generated and sent 
  Note left of  Frontend_React:  Assume the resource owner select SMS OTP.
  User_Agent_Browser ->> Frontend_React: Enter the OTP code in the OPT Verification Form.
  Frontend_React ->> Backend_Python: Verify SMS OTP code.
  Backend_Python ->> IBM_Verify_SMSOTPEP: Verify SMS OTP code against IBM Verify.
  IBM_Verify_LoginEP ->> Backend_Python: OTP code is verified with response. Access is granted.
  Backend_Python ->> Frontend_React: OTP code is verified with response. Access is granted.
  Note left of IBM_Verify_AuthEP:  RP_Geo has LoA2. Successful primary uid-pwd based authentication and 2FA authentication satisfy the LoA2 access policy. Access is granted.
  IBM_Verify_AuthEP ->> RP_Geo: callback to RP_Geo using the redirec_uri and authcode /callback&code=ccc
  RP_Geo ->> IBM_Verify_TokenEP: exchange authcode for access token, id token and store them in the session
  User_Agent_Browser ->> RP_Geo: Request services
  RP_Geo ->> IBM_Verify_IntrospectEP: Validate Access Token
  RP_Geo ->> User_Agent_Browser: Service requests