// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Breeder Batch', {

    onload: function (frm) {
        // Fetch the session variable 'org_name' from the server-side (frappe.call)
        frappe.call({
            method: 'wh_poultryos.session_getter.get_org_name_from_session',
            args: {},
            callback: function (r) {
                console.log(r);
                if (r.message) {
                    console.log(r.message);
                    // Set the hidden field value to the 'org_name' session variable
                    frm.set_value('org_name', r.message.org_name);
                }
            }
        });

    },

    module: function (frm) {
        // Check if the 'Module' field is set
        if (frm.doc.module) {
            // Filter the 'Breed' field based on the 'Module' selection
            frm.fields_dict['breed_name'].get_query = function (doc) {
                return {
                    filters: {
                        'module': doc.module  // Filter Breed based on the selected module
                    }
                };
            };
        } else {
            // If no module is selected, remove any filters
            frm.fields_dict['breed_name'].get_query = null;
            frm.set_value('breed_name', '');  // Clear the Breed field
        }
    },



    place_quantity_number_of_birds: function (frm) {
        frm.set_value("live_quantity_number_of_birds", frm.doc.place_quantity_number_of_birds || 0);
    },

    opening_date: function (frm) {

        // Automatically set live_batch_date when placement_date is entered
        if (frm.doc.opening_date) {
            let formatted_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
            frm.set_value('live_batch_date', formatted_date);
        }

        let opening_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
        // let today = frappe.datetime.get_today();
        let today = frm.doc.live_batch_date;
        let days_diff = frappe.datetime.get_diff(today, opening_date);
        frm.set_value("batch_age_in_days", days_diff || 0);
    },

    rate: function (frm) {
        frm.set_value('amount', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('biological_value', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('bird_cost', frm.doc.rate)
    },

    before_save: function (frm) {  // Runs before saving (detects new batch)
        if (frm.is_new()) {
            console.log("New Breeder Batch Detected in before_save");
            // handleDemoBreeder BatchSettings(frm);
        } else {
            console.log("Existing Breeder Batch Modified: No Count Change Needed");
        }
    },
    after_save: function (frm) {  // Redirect after save

        // Ensure mandatory fields are filled before redirecting
        if (!validateMandatoryFields(frm)) {
            return; // Stop execution if validation fails
        }

        // Redirect after successful save
        frappe.set_route("List", "Breeder Batch");
    }



});

// Function to check if mandatory fields are filled
function validateMandatoryFields(frm) {
    let missingFields = [];
    frm.meta.fields.forEach(field => {
        if (field.reqd && !frm.doc[field.fieldname]) {
            missingFields.push(field.label);
        }
    });

    if (missingFields.length > 0) {
        frappe.msgprint({
            title: __("Missing Mandatory Fields"),
            message: __("Please fill in the following fields:") + "<br><b>" + missingFields.join(", ") + "</b>",
            indicator: "red",
        });
        return false; // Stop further execution
    }
    return true; // Continue execution
}