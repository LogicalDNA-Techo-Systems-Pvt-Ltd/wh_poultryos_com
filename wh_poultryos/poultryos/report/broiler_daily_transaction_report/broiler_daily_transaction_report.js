// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt


frappe.query_reports["Broiler Daily Transaction Report"] = {
    "filters": [

        {
            "fieldname": "from_date",
            "label": __("From Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.now_date().slice(0, 4) + "-01-01",
            "reqd": 1
        },
        {
            "fieldname": "to_date",
            "label": __("To Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.get_today(),
            "reqd": 1
        },

        {
            "fieldname": "batch_status",
            "label": __("Batch Status"),
            "fieldtype": "Select",
            "options": ["", "All" ,"Batch Started", "Ready for Sale", "Completed"],
            "reqd": 1
            

        },
        {
            "fieldname": "Batch",
            "label": __("Batch"),
            "fieldtype": "Link",
            "options": "Broiler Batch",
            "reqd": 0,
            "get_query": function() {
                let batch_status = frappe.query_report.get_filter_value("batch_status");
                
                if (batch_status && batch_status !== "All") {
                    return {
                        filters: { batch_status: batch_status }
                    };
                }
                // If "All" is selected, return all batches (no filter applied)
                return {};
            }
        }


    ]
};
