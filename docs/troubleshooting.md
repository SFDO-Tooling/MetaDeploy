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

## Tracking jobs

When logged in as an admin user, go to `/admin/django-rq/` to monitor the task queue. (Replace `admin` with the value you configured for `DJANGO_ADMIN_URL` in your Heroku config vars).
