var __next_objid = 1;
function objectId(obj) {
  if (obj == null) return null;
  if (obj.__obj_id == null) obj.__obj_id = __next_objid++;
  return obj.__obj_id;
}

(jQuery.fn.outerHTML = function () {
  return jQuery('<div />').append(this.eq(0).clone()).html();
});