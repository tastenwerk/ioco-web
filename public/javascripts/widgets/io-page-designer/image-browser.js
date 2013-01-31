$(function(){
  iokit.pageDesigner.plugin({
    name: 'image-browser',
    icon: 'icn-image', // use an icon from iokit-sprites
    iconImg: null, // a full image url to be used as 16x16 icon
    hoverTitle: $.i18n.t('web.page_designer.plugins.image-browser.title'),
    renderBox: function(){
      return $('<div/>').addClass('iokit-page-box').text(this.hoverTitle);
    }
  })
})