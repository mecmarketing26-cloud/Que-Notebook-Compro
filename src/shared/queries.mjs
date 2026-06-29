/**
 * Wide laptop discovery query set, shared by the live-search index and the mint
 * job so both cover the SAME universe: every brand, MacBooks, Chromebooks, all
 * CPU/GPU lines and form factors. (`products/search` is keyword-based, so broad
 * coverage = many queries paged deep. Local-only / non-CBT is enforced later by
 * the shipping predicate.)
 */
export const NOTEBOOK_QUERIES = [
  // brands
  'notebook lenovo', 'notebook hp', 'notebook asus', 'notebook acer', 'notebook dell', 'notebook samsung',
  'notebook exo', 'notebook bangho', 'notebook msi', 'notebook gigabyte', 'notebook huawei', 'notebook lg',
  'microsoft surface', 'notebook razer', 'notebook positivo', 'notebook noblex', 'notebook hyundai',
  'notebook gateway', 'notebook toshiba', 'notebook vaio',
  // apple
  'macbook', 'macbook air', 'macbook pro', 'notebook apple',
  // cpu
  'notebook core i3', 'notebook core i5', 'notebook core i7', 'notebook core i9', 'notebook intel ultra',
  'notebook ryzen 3', 'notebook ryzen 5', 'notebook ryzen 7', 'notebook ryzen 9', 'notebook celeron', 'notebook pentium',
  // gpu / gaming
  'notebook gamer', 'notebook gamer rtx', 'notebook rtx 4050', 'notebook rtx 4060', 'notebook rtx 3050', 'notebook gtx',
  // form factor / type / generic
  'ultrabook', 'notebook 2 en 1', 'chromebook', 'notebook 13', 'notebook 14', 'notebook 15.6', 'notebook 17',
  'notebook 8gb', 'notebook 16gb', 'notebook 32gb', 'notebook ssd',
];
