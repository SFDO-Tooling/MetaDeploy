*** Settings ***

Library  SeleniumLibrary  implicit_wait=7  timeout=30
Library  ../MetaDeploy.py  ${LANG}
Resource  cumulusci/robotframework/CumulusCI.robot
Resource  ../MetaDeploy.robot

Suite Setup  Load MetaDeploy
Suite Teardown  Close All Browsers

*** Variables ***

${BASE_URL}  http://localhost:8080
${LANG}  en
${PRODUCT}  wkcc
${PLAN}  install_and_config

*** Tasks ***

Run Plan
    Go to Product  ${PRODUCT}
    Go to Plan  ${PLAN}
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/01_before_org.png
    Create Scratch Org
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/03_before_plan.png
    Run Plan  button=Install on Scratch Org
    Capture Page Screenshot  ${OUTPUTDIR}/${LANG}/04_after.png
