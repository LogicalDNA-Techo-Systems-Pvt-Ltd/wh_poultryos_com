// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Pay to Process Batch', {
    choose_modules: function (frm) {
        console.log(frm);

        if (frm.doc.choose_modules && frm.doc.choose_modules.length > 0) {
            let selected_module_names = [];

            // Fetch module names for all selected entries
            let promises = frm.doc.choose_modules.map((selectedModule) => {
                return frappe.db.get_doc('Module', selectedModule.module).then(function (response) {
                    if (response && response.module_name) {
                        selected_module_names.push(response.module_name);
                    }
                });
            });

            // Wait for all the promises to resolve before making a decision
            Promise.all(promises).then(function () {
                console.log("Selected module names:", selected_module_names);

                // Show/Hide fields based on the presence of module names
                frm.set_df_property('broiler_batch_quantity', 'hidden', !selected_module_names.includes('Broiler'));
                frm.set_df_property('breeder_batch_quantity', 'hidden', !selected_module_names.includes('BREEDER'));
                frm.set_df_property('layer_batch_quantity', 'hidden', !selected_module_names.includes('LAYER'));
            });
        } else {
            // If no modules are selected, hide all fields
            frm.set_df_property('broiler_batch_quantity', 'hidden', 1);
            frm.set_df_property('breeder_batch_quantity', 'hidden', 1);
            frm.set_df_property('layer_batch_quantity', 'hidden', 1);
        }
    }
});
