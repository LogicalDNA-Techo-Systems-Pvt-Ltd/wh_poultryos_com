// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Live Batch", {
// 	refresh(frm) {

// 	},
// });

let warningMessageShown = false;

frappe.ui.form.on('Live Batch', {
    setup: function(frm) {
        if (frm.is_new()) {
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'Live Batch Settings',
                    fieldname: 'count'
                },
                callback: function(r) {
                    const count = r.message ? r.message.count : 0;
                 
                    // Add count display
                    const countDisplay = $(`
                        <div class="live-batch-count text-center p-2" style="color: ${count === 0 ? 'red' : 'blue'}; font-weight: bold;">
                            Live Batch Count: ${count}
                        </div>
                    `);
                   
                    frm.page.wrapper.find('.page-head').css({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }).append(countDisplay);
                   
                    if (count === 0) {
                        // Disable save buttons
                        frm.page.btn_primary.hide();
                        frm.page.btn_secondary.hide();
                        
                        // Show message only if it hasn't been shown before
                        if (!warningMessageShown) {
                            frappe.msgprint({
                                title: __('Cannot Create Batch'),
                                indicator: 'red',
                                message: __('Live batch count is zero. Please purchase tokens to create new batches.') +
                                        '<br><br><a href="#List/Purchase Token" class="btn btn-primary">Purchase Tokens</a>'
                            });
                            warningMessageShown = true;
                        }
                    }
                }
            });
        }
    },

    onunload: function(frm) {
        warningMessageShown = false;
    }
});
