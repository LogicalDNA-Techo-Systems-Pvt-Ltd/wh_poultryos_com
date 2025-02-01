app_name = "wh_poultryos"
app_title = "PoultryOS"
app_publisher = "LogicalDNA Techno Systems Pvt Ltd"
app_description = "PoultryOS"
app_email = "kamlakar.y@logicaldna.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "wh_poultryos",
# 		"logo": "/assets/wh_poultryos/logo.png",
# 		"title": "PoultryOS",
# 		"route": "/wh_poultryos",
# 		"has_permission": "wh_poultryos.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/wh_poultryos/css/wh_poultryos.css"
# app_include_js = "/assets/wh_poultryos/js/wh_poultryos.js"
app_include_js = ["/assets/js/session_handler.js"]  # Include your JavaScript file


# include js, css files in header of web template
# web_include_css = "/assets/wh_poultryos/css/wh_poultryos.css"
web_include_js = "/assets/wh_poultryos/js/wh_poultryos.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "wh_poultryos/public/scss/website"

# include js, css files in header of web form
webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

page_js = {"demo-dashboard": "public/js/demo_dashboard.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"Batch": "public/js/batch_list.js"}

doctype_list_js = {
    "Batch": "public/js/batch_list.js",
    "Live Batch": "public/js/live_batch_list.js",  # Add the path for the Live Batch list view
}

# doctype_list_js = {"Live Batch": "public/js/live_batch_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "wh_poultryos/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "wh_poultryos.utils.jinja_methods",
# 	"filters": "wh_poultryos.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "wh_poultryos.install.before_install"
# after_install = "wh_poultryos.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "wh_poultryos.uninstall.before_uninstall"
# after_uninstall = "wh_poultryos.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "wh_poultryos.utils.before_app_install"
# after_app_install = "wh_poultryos.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "wh_poultryos.utils.before_app_uninstall"
# after_app_uninstall = "wh_poultryos.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "wh_poultryos.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

on_session_creation = "wh_poultryos.session_setter.set_org_name_in_session"

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    # 	"*": {
    # 		"on_update": "method",
    # 		"on_cancel": "method",
    # 		"on_trash": "method"
    # 	}
    # "*": {"onload": "wh_poultryos.api.get_org_name_from_session"},
    # "User": {"on_login": "wh_poultryos.api.set_org_name_in_session"},
    
    "CBF Daily Transaction": {
        "after_delete": "wh_poultryos.poultryos.doctype.cbf_daily_transaction.cbf_daily_transaction.show_delete_message"
    },
    
     "CBF Daily Transaction": {
        "after_save": "wh_poultryos.poultryos.doctype.cbf_daily_transaction.cbf_daily_transaction.update_batch_status"
    }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"wh_poultryos.tasks.all"
# 	],
# 	"daily": [
# 		"wh_poultryos.tasks.daily"
# 	],
# 	"hourly": [
# 		"wh_poultryos.tasks.hourly"
# 	],
# 	"weekly": [
# 		"wh_poultryos.tasks.weekly"
# 	],
# 	"monthly": [
# 		"wh_poultryos.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "wh_poultryos.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "wh_poultryos.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "wh_poultryos.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["wh_poultryos.utils.before_request"]
# after_request = ["wh_poultryos.utils.after_request"]

# Job Events
# ----------
# before_job = ["wh_poultryos.utils.before_job"]
# after_job = ["wh_poultryos.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"wh_poultryos.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

website_route_rules = [
    {"from_route": "/login", "to_route": "login"},
    {"from_route": "/register", "to_route": "register"},
    {"from_route": "/organization-setup", "to_route": "organization_setup"},
]
