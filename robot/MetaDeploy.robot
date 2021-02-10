*** Keywords ***

Load MetaDeploy
    Open Browser with Language  ${BASE_URL}
    Set Window Size  1024  1024
    ${text} =  Translate Text  Select a Product to Install
    Wait Until Page Contains  ${text}

Go to Product
    [Arguments]  ${product}
    [Documentation]  `product` is the part of the URL that identifies the product (e.g. npsp in /products/npsp)
    Go To  ${BASE_URL}/products/${product}
    ${text} =  Translate Text  Select a Plan
    Wait Until Page Contains  ${text}

Go to Plan
    [Arguments]  ${plan}
    [Documentation]  `plan` is the part of the URL that identifies the plan (e.g. install in /products/npsp/install)
    Go To  ${BASE_URL}/products/${product}/${plan}
    ${text} =  Translate Text  Log In
    Wait Until Page Contains  ${text}

Log in to Org
    ${text} =  Translate Text  Log In
    Click button  ${text}
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/03_login.png
    ${text} =  Translate Text  Use Custom Domain
    Click link  ${text}
    &{ORG} =  Get Org Info
    Input text  css:#login-custom-domain  ${ORG}[instance_url]
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/04_custom_domain.png
    ${text} =  Translate Text  Continue
    Click button  ${text}
    Input text  css:#username  ${ORG}[username]
    Input password  css:#password  ${ORG}[password]
    Click button  css:#Login
    ${needs_oauth_approval}=  Run Keyword And Return Status
    ...  Element Should Be Visible   css:#oaapprove
    Run Keyword If    ${needs_oauth_approval}  Click button  css:#oaapprove

Maybe Run Preflight
    ${text1} =  Translate Text  Start Pre-Install Validation
    ${text2} =  Translate Text  Re-Run Pre-Install Validation
    ${has_preflight} =  Run Keyword and Return Status
    ...  Wait Until Page Contains Element  //button[text()="${text1}"]|//button[text()="${text2}"]
    ...  timeout=5
    Run Keyword If  ${has_preflight}  Run Preflight

Run Preflight
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/05_preflight.png
    ${text1} =  Translate Text  Start Pre-Install Validation
    ${text2} =  Translate Text  Re-Run Pre-Install Validation
    Click button  //button[text()="${text1}"]|//button[text()="${text2}"]
    ${text} =  Translate Text  Pre-install validation completed successfully.
    Wait Until Page Contains  ${text}  timeout=300

Maybe Execute Clickthrough
    ${has_clickthrough} =  Run Keyword and Return Status
    ...  Wait Until Page Contains Element  //label[@for="click-through-confirm"]
    ...  timeout=5
    Run Keyword If  ${has_clickthrough}  Execute Clickthrough

Execute Clickthrough
    Click element  //label[@for="click-through-confirm"]
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/07_agreement.png
    ${text} =  Translate Text  Confirm
    Wait Until Page Contains  ${text}
    Click button  ${text}

Run Plan
    [Arguments]  ${button}=Install
    ${text} =  Translate Text  ${button}
    Click button  ${text}
    Maybe Execute Clickthrough
    ${text} =  Translate Text  Installation completed successfully.
    Wait Until Page Contains  ${text}  timeout=1200


Create Scratch Org
    ${text} =  Translate Text  Create Scratch Org
    Click button  ${text}
    ${text} =  Translate Text  Email
    Wait Until Page Contains  ${text}
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/02_email.png
    Input text  css:#scratch-org-email  test@example.com
    ${text} =  Translate Text  Confirm
    Click button  ${text}
    ${text} =  Translate Text  Install on Scratch Org
    Wait Until Page Contains  ${text}
