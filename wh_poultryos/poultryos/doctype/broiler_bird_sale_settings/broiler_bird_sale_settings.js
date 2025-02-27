// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Broiler Bird Sale Settings", {
    refresh(frm) {

    },

    onload: function (frm) {
        // Fetch organization name
        frappe.call({
            method: 'wh_poultryos.session_getter.get_org_name_from_session',
            callback: function (r) {
                console.log(r.message);
                if (r.message) {
                    frm.set_value('organization', r.message.org_name);
                }
            }
        });
    },
});
