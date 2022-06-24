# Tutorial

## Overview

MetaDeploy makes it possible to publish a CumulusCI flow as an installer
so that it can be repeated by any user who brings their own org.

A single instance of MetaDeploy can host installers for multiple
Products and multiple Versions of each Product. For each version,
multiple Plans can be configured. Each Plan represents a separate series
of Steps that will be run in sequence to complete the installation.

## Publishing an installer

Setting up a new product in MetaDeploy requires access to the Django
admin UI. Once the product has been set up, new versions can be
published by running a command using the `cci` CLI. This guide assumes
you are already familiar with CumulusCI and have it set up for your
project.

### 1. Add a Product Category

Start by logging into the MetaDeploy admin UI.

Each Product must be assigned to a Product Category. If there aren't
any Product Categories yet, click the Add link for Product Categories,
enter a Title, and save.

### 2. Add a Product

Click on the Add link for Products. At minimum, enter a product
category, Repo URL, and Title. It's important that the Repo URL matches
the one in your project's cumulusci.yml file, because it's how
CumulusCI will find the right product in MetaDeploy.

Check the "Is Listed" box if you want the product to be shown in the
MetaDeploy product listing. Leave it unchecked if you want the product
to only be accessed by its URL.

Short Description will be shown on the card in the product listing.
Description will be shown on the right side of the product's main page.
If you enter a Click Through Agreement text, users will be prompted to
agree to it before running installation plans for this product. Users
will be shown the Error Message in a modal dialog if there's an error
during installation.

### 2. Add a Product Slug

In order to be accessible by a URL, a Product must have a Product Slug.
Click the Add link for Product Slugs. Enter a slug (which will be used
in the URL) and select the corresponding product.

If a product has multiple slugs, older active slugs will redirect to the
most recent active slug. This is useful if a product changes names.

### 3. Configure a plan in cumulusci.yml

Add a `plans` section to your cumulusci.yml file like this:

```yaml
plans:
    install:
        slug: install
        title: Install
        tier: primary
        steps:
            1:
                flow: install_prod
```

This sets us up to publish the `install_prod` flow to a Plan that will
be the primary (default) Plan for the Product and available with
`/install` in the URL (from the slug).

### 4. Connect CumulusCI to MetaDeploy

This is a one-time setup task. In the MetaDeploy admin UI, go to the
Tokens object (under Auth Tokens) and create one for your user.

In your terminal, run `cci service connect metadeploy`. Enter the base
API `url` (e.g. `https://metadeploy_domain/admin/rest` and the token you
just created.

### 5. Publish the plan

Each time you're ready to publish the Plans for a new version of your
Product, run:

    cci task run metadeploy_publish -o tag TAG -o dry_run True

substituting TAG with the name of the tag you want to publish. The
`dry_run` flag will make it print out the steps that will be sent to
MetaDeploy without actually doing so. Once you've reviewed them, you
can run the same command for real:

    cci task run metadeploy_publish -o tag TAG

This task will create a Version (unless it already exists), a Plan, a
series of Steps for that Plan, and a Plan Slug (unless it already
exists).

By default, all plans defined in cumulusci.yml will be published.
Specify the `plan` option to publish one specific Plan:

    cci task run metadeploy_publish -o tag TAG -o plan install

### 6. Test the installer

Run the installer to make sure it works as expected!
