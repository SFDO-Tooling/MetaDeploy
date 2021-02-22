*** Settings ***

Library  SeleniumLibrary  implicit_wait=7  timeout=30
Library  ../MetaDeploy.py  ${LANG}
Resource  cumulusci/robotframework/CumulusCI.robot
Resource  ../MetaDeploy.robot

Suite Setup  Load MetaDeploy
Suite Teardown  Close All Browsers

*** Variables ***

${BASE_URL}  https://metadeploy-stg.herokuapp.com
${LANG}  en
${PRODUCT}  npsp
${PLAN}  install

*** Tasks ***

Run Plan
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/01_home.png
    Go to Product  ${PRODUCT}
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/02_product.png
    Go to Plan  ${PLAN}
    Log in to Org
    Maybe Run Preflight
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/06_ready.png
    Run Plan
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/08_success.png
