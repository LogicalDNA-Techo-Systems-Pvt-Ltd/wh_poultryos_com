frappe.ui.form.on('Standard Chart', {
    refresh: function (frm) {
        calculate_fcr(frm);
    },
    standard_avg_bird_weight: function (frm) {
        calculate_fcr(frm);
    },
    standard_total_feed_consumption: function (frm) {
        calculate_fcr(frm);
    }
});

function calculate_fcr(frm) {
    if (frm.doc.standard_avg_bird_weight && frm.doc.standard_total_feed_consumption) {
        let fcr = frm.doc.standard_total_feed_consumption / frm.doc.standard_avg_bird_weight;
        frm.set_value('standard_fcr', fcr);
    } else {
        frm.set_value('standard_fcr', 0);
    }
}