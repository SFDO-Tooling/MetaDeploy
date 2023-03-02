const urls = window.api_urls;
const WILDCARD = "*****";

const dummyData = {};

// Build out library of mock data
dummyData[urls.productcategory_list()] = [
  {
    "id": 1,
    "title": "Salesforce.org Products",
    "description": "<p>Sample products from Salesforce.org. <strong>Descriptions support Markdown</strong>.</p>",
    "is_listed": true,
    "first_page": {
      "count": 5,
      "next": null,
      "previous": null,
      "results": [
        {
          "id": "74r6Vrl",
          "title": "Product With Useful Data",
          "description": "<p>Description for Product With Useful Data: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "short_description": "",
          "click_through_agreement": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "category": "Salesforce.org Products",
          "color": "",
          "icon": null,
          "image": null,
          "most_recent_version": {
            "id": "MzZVArp",
            "product": "74r6Vrl",
            "label": "0.3.1",
            "description": "This is a description of the product version.",
            "created_at": "2022-12-20T22:00:56.841077Z",
            "primary_plan": {
              "id": "MzZVArp",
              "title": "Full Install",
              "version": "MzZVArp",
              "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
              "tier": "primary",
              "slug": "full-install",
              "old_slugs": [],
              "order_key": 0,
              "steps": [
                {
                  "id": "74r6Vrl",
                  "name": "Quick step",
                  "description": "This is a description of the step. Could be any step, optional or required. The description wraps.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "MzZVArp",
                  "name": "Slow step",
                  "description": "",
                  "is_required": false,
                  "is_recommended": false,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "xKr0aZQ",
                  "name": "Medium step",
                  "description": "This is a step description.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "One Time Apex",
                  "kind_icon": "apex"
                },
                {
                  "id": "DgrklZ6",
                  "name": "Relationships",
                  "description": "",
                  "is_required": false,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "nR2Xy3G",
                  "name": "Affiliations Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
                  "description": "This is a step description.",
                  "is_required": false,
                  "is_recommended": true,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "vPZvjZD",
                  "name": "Account Record Types Also Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
                  "description": "",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "GPZyW38",
                  "name": "Nonprofit Success Pack",
                  "description": "",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "1B3BOrR",
                  "name": "NPSP Config for Salesforce1",
                  "description": "This is a step description.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Data",
                  "kind_icon": "paste"
                },
                {
                  "id": "eM3aQ3Q",
                  "name": "Contacts and Organizations",
                  "description": "This is a step description.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "OvrAarn",
                  "name": "Another Ordered Step",
                  "description": "This is a step description.",
                  "is_required": false,
                  "is_recommended": true,
                  "kind": "Package",
                  "kind_icon": "archive"
                }
              ],
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": null,
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "secondary_plan": {
              "id": "xKr0aZQ",
              "title": "Reports and Dashboards",
              "version": "MzZVArp",
              "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
              "tier": "secondary",
              "slug": "reports-and-dashboards",
              "old_slugs": [],
              "order_key": 0,
              "steps": [
                {
                  "id": "py3WYZN",
                  "name": "Quick step",
                  "description": "This is a description of the step. Could be any step, optional or required. The description wraps.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "5LroKr8",
                  "name": "Slow step",
                  "description": "",
                  "is_required": false,
                  "is_recommended": false,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "PD2Lnrj",
                  "name": "Medium step",
                  "description": "This is a step description.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "One Time Apex",
                  "kind_icon": "apex"
                },
                {
                  "id": "PWrm9rg",
                  "name": "Relationships",
                  "description": "",
                  "is_required": false,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "qR3GN2a",
                  "name": "Affiliations Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
                  "description": "This is a step description.",
                  "is_required": false,
                  "is_recommended": true,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "mJ2152k",
                  "name": "Account Record Types Also Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
                  "description": "",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "Pl39P2y",
                  "name": "Nonprofit Success Pack",
                  "description": "",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "ajZzvZq",
                  "name": "NPSP Config for Salesforce1",
                  "description": "This is a step description.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Data",
                  "kind_icon": "paste"
                },
                {
                  "id": "DArl73M",
                  "name": "Contacts and Organizations",
                  "description": "This is a step description.",
                  "is_required": true,
                  "is_recommended": false,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "MWrOorv",
                  "name": "Another Ordered Step",
                  "description": "This is a step description.",
                  "is_required": false,
                  "is_recommended": true,
                  "kind": "Package",
                  "kind_icon": "archive"
                }
              ],
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": null,
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "is_listed": true
          },
          "slug": "product-with-useful-data",
          "old_slugs": [],
          "is_allowed": true,
          "is_listed": true,
          "order_key": 0,
          "not_allowed_instructions": null,
          "layout": "Default"
        },
        {
          "id": "NV2RdrP",
          "title": "Education Data Architecture (EDA)",
          "description": "<h2>Welcome to the EDA installer!</h2>",
          "short_description": "The Foundation for the Connected Campus",
          "click_through_agreement": "<p>The Education Data Architecture technology (“EDA”) is an open-source package licensed by Salesforce.org (“SFDO”) under the BSD-3 Clause License, found at <a href=\"https://opensource.org/licenses/BSD-3-Clause\">https://opensource.org/licenses/BSD-3-Clause</a>. ANY MASTER SUBSCRIPTION AGREEMENT YOU OR YOUR ENTITY MAY HAVE WITH SFDO DOES NOT APPLY TO YOUR USE OF EDA. EDA is provided “AS IS” AND AS AVAILABLE, AND SFDO MAKES NO WARRANTY OF ANY KIND REGARDING EDA, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, FREEDOM FROM DEFECTS OR NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.</p>\n<p>SFDO WILL HAVE NO LIABILITY ARISING OUT OF OR RELATED TO YOUR USE OF EDA FOR ANY DIRECT DAMAGES OR FOR ANY LOST PROFITS, REVENUES, GOODWILL OR INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, COVER, BUSINESS INTERRUPTION OR PUNITIVE DAMAGES, WHETHER AN ACTION IS IN CONTRACT OR TORT AND REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR IF A REMEDY OTHERWISE FAILS OF ITS ESSENTIAL PURPOSE. THE FOREGOING DISCLAIMER WILL NOT APPLY TO THE EXTENT PROHIBITED BY LAW. SFDO DISCLAIMS ALL LIABILITY AND INDEMNIFICATION OBLIGATIONS FOR ANY HARM OR DAMAGES CAUSED BY ANY THIRD-PARTY HOSTING PROVIDERS.</p>",
          "category": "Salesforce.org Products",
          "color": "#0088FF",
          "icon": {
            "type": "slds",
            "category": "custom",
            "name": "custom51"
          },
          "image": null,
          "most_recent_version": {
            "id": "pA3NxZY",
            "product": "NV2RdrP",
            "label": "1.75",
            "description": null,
            "created_at": "2022-12-20T22:01:04.961948Z",
            "primary_plan": {
              "id": "qR24KZ4",
              "title": "Install",
              "version": "pA3NxZY",
              "preflight_message": "<h1>Welcome to the EDA installer!</h1>",
              "tier": "primary",
              "slug": "install",
              "old_slugs": [],
              "order_key": 0,
              "steps": [
                {
                  "id": "PZyvW28",
                  "name": "EDA - Account Record Types",
                  "description": "",
                  "is_required": true,
                  "is_recommended": true,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "B3BPOZR",
                  "name": "EDA - Contact Key Affiliation Fields",
                  "description": "",
                  "is_required": true,
                  "is_recommended": true,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "M3avQrQ",
                  "name": "Install EDA 1.75",
                  "description": "",
                  "is_required": true,
                  "is_recommended": true,
                  "kind": "Package",
                  "kind_icon": "archive"
                },
                {
                  "id": "vrA4a3n",
                  "name": "Course Connection Record Types for EDA",
                  "description": "",
                  "is_required": true,
                  "is_recommended": true,
                  "kind": "Metadata",
                  "kind_icon": "package"
                },
                {
                  "id": "y3WJY2N",
                  "name": "Facility Display Name Formula Field",
                  "description": "",
                  "is_required": true,
                  "is_recommended": true,
                  "kind": "Metadata",
                  "kind_icon": "package"
                }
              ],
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": null,
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Both",
              "scratch_org_duration": 30
            },
            "secondary_plan": null,
            "is_listed": true
          },
          "slug": "eda",
          "old_slugs": [],
          "is_allowed": true,
          "is_listed": true,
          "order_key": 0,
          "not_allowed_instructions": null,
          "layout": "Default"
        },
        {
          "id": "MzZVArp",
          "title": "Red Salesforce Product",
          "description": "<p>This product should have a red icon.</p>",
          "short_description": "",
          "click_through_agreement": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "category": "Salesforce.org Products",
          "color": "#c23934",
          "icon": null,
          "image": null,
          "most_recent_version": {
            "id": "xKr0aZQ",
            "product": "MzZVArp",
            "label": "0.3.1",
            "description": "This is a description of the product version.",
            "created_at": "2022-12-20T22:01:01.034312Z",
            "primary_plan": {
              "id": "GPZyW38",
              "title": "Full Install",
              "version": "xKr0aZQ",
              "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
              "tier": "primary",
              "slug": "full-install",
              "old_slugs": [],
              "order_key": 0,
              "steps": [],
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": null,
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "secondary_plan": null,
            "is_listed": true
          },
          "slug": "red-salesforce-product",
          "old_slugs": [],
          "is_allowed": true,
          "is_listed": true,
          "order_key": 1,
          "not_allowed_instructions": null,
          "layout": "Default"
        },
        {
          "id": "xKr0aZQ",
          "title": "Custom Icon Salesforce Product",
          "description": "<p>This product should have a custom icon.</p>",
          "short_description": "",
          "click_through_agreement": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "category": "Salesforce.org Products",
          "color": "",
          "icon": {
            "type": "url",
            "url": "https://lightningdesignsystem.com/assets/images/avatar3.jpg"
          },
          "image": null,
          "most_recent_version": {
            "id": "DgrklZ6",
            "product": "xKr0aZQ",
            "label": "0.3.1",
            "description": "This is a description of the product version.",
            "created_at": "2022-12-20T22:01:01.187620Z",
            "primary_plan": {
              "id": "1B3BOrR",
              "title": "Restricted Plan",
              "version": "DgrklZ6",
              "preflight_message": null,
              "tier": "primary",
              "slug": "restricted-plan",
              "old_slugs": [],
              "order_key": 0,
              "steps": null,
              "is_allowed": false,
              "is_listed": true,
              "not_allowed_instructions": "<p>This item is restricted. No <a href=\"http://www.oddbird.net/birds\">OddBirds</a> allowed!</p>",
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "secondary_plan": {
              "id": "eM3aQ3Q",
              "title": "Unrestricted Plan",
              "version": "DgrklZ6",
              "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
              "tier": "secondary",
              "slug": "unrestricted-plan",
              "old_slugs": [],
              "order_key": 0,
              "steps": [],
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": null,
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "is_listed": true
          },
          "slug": "custom-icon-salesforce-product",
          "old_slugs": [],
          "is_allowed": true,
          "is_listed": true,
          "order_key": 2,
          "not_allowed_instructions": null,
          "layout": "Default"
        },
        {
          "id": "DgrklZ6",
          "title": "Custom SLDS Icon Salesforce Product",
          "description": null,
          "short_description": "",
          "click_through_agreement": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "category": "Salesforce.org Products",
          "color": "",
          "icon": {
            "type": "slds",
            "category": "utility",
            "name": "world"
          },
          "image": null,
          "most_recent_version": {
            "id": "nR2Xy3G",
            "product": "DgrklZ6",
            "label": "0.3.1",
            "description": "This is a description of the product version.",
            "created_at": "2022-12-20T22:01:01.397901Z",
            "primary_plan": {
              "id": "OvrAarn",
              "title": "Full Install",
              "version": "nR2Xy3G",
              "preflight_message": null,
              "tier": "primary",
              "slug": "full-install",
              "old_slugs": [],
              "order_key": 0,
              "steps": null,
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": "<p>This item is restricted. No <a href=\"http://www.oddbird.net/birds\">OddBirds</a> allowed!</p>",
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "secondary_plan": null,
            "is_listed": true
          },
          "slug": "custom-slds-icon-salesforce-product",
          "old_slugs": [],
          "is_allowed": false,
          "is_listed": true,
          "order_key": 3,
          "not_allowed_instructions": "<p>This item is restricted. No <a href=\"http://www.oddbird.net/birds\">OddBirds</a> allowed!</p>",
          "layout": "Default"
        }
      ]
    }
  },
  {
    "id": 2,
    "title": "Community Products",
    "description": "",
    "is_listed": true,
    "first_page": {
      "count": 30,
      "next": "http://localhost:8080/api/products/?category=2&page=2",
      "previous": null,
      "results": [
        {
          "id": "nR2Xy3G",
          "title": "Sample Community Product 0",
          "description": "<p>Description for Sample Community Product 0: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "short_description": "",
          "click_through_agreement": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tellus elementum sagittis vitae et leo duis ut diam. Sem fringilla ut morbi tincidunt augue interdum velit euismod. Volutpat est velit egestas dui id ornare arcu. Viverra tellus in hac habitasse platea dictumst. Nulla facilisi etiam dignissim diam.</p>",
          "category": "Community Products",
          "color": "",
          "icon": null,
          "image": null,
          "most_recent_version": {
            "id": "vPZvjZD",
            "product": "nR2Xy3G",
            "label": "0.3.1",
            "description": "This is a description of the product version.",
            "created_at": "2022-12-20T22:01:01.502385Z",
            "primary_plan": {
              "id": "py3WYZN",
              "title": "Full Install",
              "version": "vPZvjZD",
              "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
              "tier": "primary",
              "slug": "full-install",
              "old_slugs": [],
              "order_key": 0,
              "steps": [],
              "is_allowed": true,
              "is_listed": true,
              "not_allowed_instructions": null,
              "average_duration": null,
              "requires_preflight": false,
              "supported_orgs": "Persistent",
              "scratch_org_duration": 30
            },
            "secondary_plan": null,
            "is_listed": true
          },
          "slug": "sample-community-product-0",
          "old_slugs": [],
          "is_allowed": true,
          "is_listed": true,
          "order_key": 0,
          "not_allowed_instructions": null,
          "layout": "Default"
        }
      ]
    }
  }
];

dummyData[urls.org_list()] = {
  "testData": {
    "org_id": null,
    "current_job": null,
    "current_preflight": null
  }
};

dummyData[urls.version_additional_plans(WILDCARD)] = [
  {
    "id": "DgrklZ6",
    "title": "Account Record Types",
    "version": "MzZVArp",
    "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
    "tier": "additional",
    "slug": "account-record-types",
    "old_slugs": [],
    "order_key": 0,
    "steps": [
      {
        "id": "NP2dA3Q",
        "name": "Quick step",
        "description": "This is a description of the step. Could be any step, optional or required. The description wraps.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Metadata",
        "kind_icon": "package"
      },
      {
        "id": "y82KL3x",
        "name": "Slow step",
        "description": "",
        "is_required": false,
        "is_recommended": false,
        "kind": "Metadata",
        "kind_icon": "package"
      },
      {
        "id": "WDrPdrx",
        "name": "Medium step",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "One Time Apex",
        "kind_icon": "apex"
      },
      {
        "id": "xlr7xZ0",
        "name": "Relationships",
        "description": "",
        "is_required": false,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "Yd3ed28",
        "name": "Affiliations Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
        "description": "This is a step description.",
        "is_required": false,
        "is_recommended": true,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "wL2gar4",
        "name": "Account Record Types Also Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
        "description": "",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "4B2jJ2a",
        "name": "Nonprofit Success Pack",
        "description": "",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "Yd2Ywrg",
        "name": "NPSP Config for Salesforce1",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Data",
        "kind_icon": "paste"
      },
      {
        "id": "7Y3QoZ6",
        "name": "Contacts and Organizations",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "e1ZJVZ5",
        "name": "Another Ordered Step",
        "description": "This is a step description.",
        "is_required": false,
        "is_recommended": true,
        "kind": "Package",
        "kind_icon": "archive"
      }
    ],
    "is_allowed": true,
    "is_listed": true,
    "not_allowed_instructions": null,
    "average_duration": null,
    "requires_preflight": true,
    "supported_orgs": "Persistent",
    "scratch_org_duration": 30
  },
  {
    "id": "nR2Xy3G",
    "title": "Plan-Level Failing Preflight",
    "version": "MzZVArp",
    "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
    "tier": "additional",
    "slug": "plan-level-failing-preflight",
    "old_slugs": [],
    "order_key": 0,
    "steps": [
      {
        "id": "g9ZEw3V",
        "name": "Quick step",
        "description": "This is a description of the step. Could be any step, optional or required. The description wraps.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Metadata",
        "kind_icon": "package"
      },
      {
        "id": "6QrwB3p",
        "name": "Slow step",
        "description": "",
        "is_required": false,
        "is_recommended": false,
        "kind": "Metadata",
        "kind_icon": "package"
      },
      {
        "id": "9M28GZn",
        "name": "Medium step",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "One Time Apex",
        "kind_icon": "apex"
      },
      {
        "id": "mo3Dw2q",
        "name": "Relationships",
        "description": "",
        "is_required": false,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "NV2RdrP",
        "name": "Affiliations Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
        "description": "This is a step description.",
        "is_required": false,
        "is_recommended": true,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "pA3NxZY",
        "name": "Account Record Types Also Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
        "description": "",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "YR2pjrx",
        "name": "Nonprofit Success Pack",
        "description": "",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "6mZnP3b",
        "name": "NPSP Config for Salesforce1",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Data",
        "kind_icon": "paste"
      },
      {
        "id": "6KZM8rd",
        "name": "Contacts and Organizations",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "dG2qb3J",
        "name": "Another Ordered Step",
        "description": "This is a step description.",
        "is_required": false,
        "is_recommended": true,
        "kind": "Package",
        "kind_icon": "archive"
      }
    ],
    "is_allowed": true,
    "is_listed": true,
    "not_allowed_instructions": null,
    "average_duration": null,
    "requires_preflight": true,
    "supported_orgs": "Persistent",
    "scratch_org_duration": 30
  },
  {
    "id": "vPZvjZD",
    "title": "Preflight With Warnings",
    "version": "MzZVArp",
    "preflight_message": "<p>Preflight message consists of generic product message and step pre-check info — run in one operation before the install begins. Preflight includes the name of what is being installed. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>",
    "tier": "additional",
    "slug": "preflight-with-warnings",
    "old_slugs": [],
    "order_key": 0,
    "steps": [
      {
        "id": "qR24KZ4",
        "name": "Quick step",
        "description": "This is a description of the step. Could be any step, optional or required. The description wraps.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Metadata",
        "kind_icon": "package"
      },
      {
        "id": "Yg3xG2q",
        "name": "Slow step",
        "description": "",
        "is_required": false,
        "is_recommended": false,
        "kind": "Metadata",
        "kind_icon": "package"
      },
      {
        "id": "RLZ5O3P",
        "name": "Medium step",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "One Time Apex",
        "kind_icon": "apex"
      },
      {
        "id": "v3byo2b",
        "name": "Relationships",
        "description": "",
        "is_required": false,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "4r6VVrl",
        "name": "Affiliations Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
        "description": "This is a step description.",
        "is_required": false,
        "is_recommended": true,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "zZVMArp",
        "name": "Account Record Types Also Has A Really Really Really Long Name To Be Sure The Table Layout Does Not Break",
        "description": "",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "Kr05aZQ",
        "name": "Nonprofit Success Pack",
        "description": "",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "grknl36",
        "name": "NPSP Config for Salesforce1",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Data",
        "kind_icon": "paste"
      },
      {
        "id": "R2Xqy3G",
        "name": "Contacts and Organizations",
        "description": "This is a step description.",
        "is_required": true,
        "is_recommended": false,
        "kind": "Package",
        "kind_icon": "archive"
      },
      {
        "id": "PZvGj2D",
        "name": "Another Ordered Step",
        "description": "This is a step description.",
        "is_required": false,
        "is_recommended": true,
        "kind": "Package",
        "kind_icon": "archive"
      }
    ],
    "is_allowed": true,
    "is_listed": true,
    "not_allowed_instructions": null,
    "average_duration": null,
    "requires_preflight": true,
    "supported_orgs": "Persistent",
    "scratch_org_duration": 30
  }
]

dummyData[urls.job_detail(WILDCARD)] = {
  "testData": {
    "org_id": null,
    "current_job": null,
    "current_preflight": null
  }
};

export { dummyData, WILDCARD };
