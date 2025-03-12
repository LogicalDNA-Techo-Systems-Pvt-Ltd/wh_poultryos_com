// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.query_reports["Broiler Deviation Report"] = {
	"filters": [
		
        {
            "fieldname": "Batch",
            "label": __("Batch"),
            "fieldtype": "Link",
            "options": "Broiler Batch",
            "reqd": 1
        }
	]
};
