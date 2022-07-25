# Troubleshooting

## My plan is not visible

1.  Check the Product:
    - Make sure "Is listed" is checked. (If not, the product can only be
      accessed via its URL.)
    - Make sure there is an active Product Slug associated with the product.
    - If the product has a value for "Visible to", make sure that Allowed List
      allows either the specific org you're testing, or its org type.
2.  Check the Version:
    - Make sure "Is listed" is checked.
3.  Check the Plan:
    - Make sure "Is listed" is checked. (If not, the plan can only be accessed
      via its URL.)
    - Make sure there is at least one plan with Tier = primary.
    - Make sure there is an active Plan Slug associated with the plan's Plan
      Template.
    - If the plan has a value for "Visible to", make sure that Allowed List
      allows either the specified org you're testing, or its org type.

## I am unable to connect a Salesforce Org

1. Check the Callback URL
   - The registered Callback-Url should look somethin like this: https://YOURAPPNAMEHERE.herokuapp.com/accounts/salesforce/login/callback/
2. Check the granted OAuth App Scopes. It should contain : full, refesh_token, web
