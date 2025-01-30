// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Batch', {

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

    // after_save: function (frm) {

    //     frappe.call({
    //         method: "frappe.client.get_value",
    //         args: {
    //             doctype: "Demo Batch Settings",
    //             fieldname: "count",
    //         },
    //         callback: function (response) {
    //             const currentCount = response.message ? response.message.count : 0;

    //             if (currentCount > 0) {
    //                 frappe.call({
    //                     method: "frappe.client.set_value",
    //                     args: {
    //                         doctype: "Demo Batch Settings",
    //                         name: "DEMO-052", // Replace with your settings name
    //                         fieldname: "count",
    //                         value: currentCount - 1,
    //                     },
    //                     callback: function () {
    //                         frappe.msgprint({
    //                             title: __("Count Updated"),
    //                             message: __("Demo Batch Count has been decremented."),
    //                             indicator: "green",
    //                         });

    //                         // Redirect to the Batch list view and refresh it
    //                         frappe.set_route("List", "Batch").then(() => {
    //                             frappe.after_ajax(() => {
    //                                 if (cur_list) {
    //                                     cur_list.reload_doc();
    //                                 }
    //                             });
    //                         });
    //                     },
    //                 });
    //             } else {
    //                 frappe.msgprint({
    //                     title: __("Count Unchanged"),
    //                     message: __("Demo Batch Count is already zero."),
    //                     indicator: "red",
    //                 });
    //             }
    //         },
    //     });

    // }

    before_save: function (frm) {  // Runs before saving (detects new batch)
        if (frm.is_new()) {
            console.log("New Batch Detected in before_save");
            handleDemoBatchSettings(frm);
        } else {
            console.log("Existing Batch Modified: No Count Change Needed");
        }
    },
    after_save: function (frm) {  // Redirect after save

        // Ensure mandatory fields are filled before redirecting
        if (!validateMandatoryFields(frm)) {
            return; // Stop execution if validation fails
        }

        // Redirect after successful save
        frappe.set_route("List", "Batch");
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

function handleDemoBatchSettings(frm) {
    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Demo Batch Settings",
            fieldname: ["name", "count"],
        },
        callback: function (response) {
            if (response.message) {
                const settingsName = response.message.name;
                const currentCount = response.message.count;

                if (currentCount > 0) {
                    frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: "Demo Batch Settings",
                            name: settingsName,
                            fieldname: "count",
                            value: currentCount - 1,
                        },
                        callback: function () {
                            frappe.msgprint({
                                title: __("Count Updated"),
                                message: __("Demo Batch Count has been decremented."),
                                indicator: "green",
                            });

                            
                        },
                    });
                } else {
                    frappe.msgprint({
                        title: __("Count Unchanged"),
                        message: __("Demo Batch Count is already zero."),
                        indicator: "red",
                    });
                }
            } else {
                frappe.msgprint({
                    title: __("Error"),
                    message: __("Demo Batch Settings not found."),
                    indicator: "red",
                });
            }
        },
    });
}