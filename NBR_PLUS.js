var mask_s2 = function(image) {
  var cs = image.select('cs_cdf');
  return image.updateMask(cs.gte(0.6));
};

var s2_collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(lawu)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .linkCollection(ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED'), ['cs_cdf'])
  .map(mask_s2);

var pre_fire = s2_collection
  .filterDate('2023-08-01', '2023-08-29')
  .median()
  .clip(lawu);

var post_fire = s2_collection
  .filterDate('2023-10-01', '2023-10-31')
  .median()
  .clip(lawu);

var calc_nbr_plus = function(image) {
  var b12 = image.select('B12');
  var b8a = image.select('B8A');
  var b3 = image.select('B3');
  var b2 = image.select('B2');
  
  var num = b12.subtract(b8a).subtract(b3).subtract(b2);
  var den = b12.add(b8a).add(b3).add(b2);
  
  return num.divide(den).rename('nbr_plus');
};

var nbr_plus_pre = calc_nbr_plus(pre_fire);
var nbr_plus_post = calc_nbr_plus(post_fire);

var d_nbr_plus = nbr_plus_post.subtract(nbr_plus_pre).rename('d_nbr_plus');
var burn_treshold = d_nbr_plus.gte(0.3);

Map.centerObject(lawu, 14);

Map.addLayer(post_fire, {bands: ['B11', 'B8', 'B4'], min : 0, max : 4000}, 'Citra Kebakaran');
Map.addLayer(burn_treshold.selfMask(), {palette: ['red']}, 'Area Terbakar');

