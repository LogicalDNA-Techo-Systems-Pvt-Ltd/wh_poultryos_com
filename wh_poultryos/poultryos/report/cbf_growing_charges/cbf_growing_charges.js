// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.query_reports["CBF Growing Charges"] = {
	"filters": [

		{
            "fieldname": "Batch",
            "label": __("Batch"),
            "fieldtype": "Link",
            "options": "CBF Batch",
            "reqd": 0
        }
	]
};
