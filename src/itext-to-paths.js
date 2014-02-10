var iTextToGroupOfPaths = (function() {
  
  var fontCache = {};

  // dummy function for finding the svg font file associated with a font
  function fontNameToPath(fontName) {
    return "assets/"+fontName+".svg";
  }

  // load and cache the svg fonts as they are needed
  // this depends on fabric.util.loadFont
  // from https://gist.github.com/aggrosoft/5805339#file-svgtext-js
  function getFontByName(fontName, callback) {
    if( !fontCache[fontName] ){
      console.log("font ("+fontName+") NOT in cache, getting it from: "+fontNameToPath(fontName));
      fabric.util.loadFont(fontNameToPath(fontName), function (font) {
        fontCache[fontName] = font;
        callback(font);
      });
    } else {
      console.log("font ("+fontName+") found in cache");
      callback(fontCache[fontName]);
    }
  }

  // look up the glyphs from the svg font
  // and split them up by lines
  function getGlyphs(itext, font){
    var text_lines = itext.text.split("\n")
    var lines = [];
    for(var i=0; i<text_lines.length;i++){e
      var chars = text_lines[i];
      var line= [];
      for(var n=0; n<chars.length; n++){
        line.push( getGlyph(chars[n], font) )
      }
      lines.push( line );
    }
    return lines;
  }

  function getGlyph(char, font) {
    var g = font.glyphs[char];
    return g;
  }

  function getUnitScale(font) {
    return 1 / font.fontface.unitsPerEm;
  }

  // create fabric.Path objects for each letter
  // and position them top / left (pre-font-scaling)
  function positionCharPaths(lines, otext, font) {
    var xPos, yPos;
    var char_paths = [];
    for(var l=0; l<lines.length; l++){
      var glyphs = lines[l];
      xPos = 0;
      yPos = l*(font.fontface.lineHeight-1.5*font.fontface.descent)

      for(var n=0; n<glyphs.length; n++) {
        var g = glyphs[n];
        var kerning = (n===glyphs.length-1)? 0 : getKerning(g, glyphs[n+1], font);

        // Some characters, for example " " (space) dont have a path associated with them
        // if not, still need to take into account the horizontal advance
        if(g.data){
          var path = new fabric.Path(g.data,{top:l*font.fontface.lineHeight,left:0,width:font.fontface.unitsPerEm,height:font.fontface.lineHeight}) 
          path.setScaleY(-1);
          char_paths.push(path);
          path.setLeft(xPos);
          path.setTop(yPos)
        }
        xPos += g.horizAdvX - kerning;
      }

    }
    return char_paths;
  }

  // group the characters together and scale them to the right size
  function groupCharPaths(char_paths, otext, font) {
    var g = new fabric.Group();
    for(var n=0;n<char_paths.length; n++){
      g.add(char_paths[n]);
    }

    var scale = getUnitScale(font)*otext.fontSize;

    var left = otext.left;
        left -= font.fontface.unitsPerEm * scale / 2

    var top = otext.top;
        top += otext.lineHeight * otext.fontSize / 2;
        top += font.fontface.descent * scale / 2; 


    g.setScaleX(getUnitScale(font) * otext.fontSize)
    g.setScaleY(getUnitScale(font) * otext.fontSize);

    g.setTop(top);
    g.setLeft(left);

    return g;
  }

  function getKerning(g,ng, font){
    // console.log(g, ng)
      var hkern = 0;
      if(ng){
          var g1 = g.glyphName;
          var g2 = ng.glyphName;
          
          // console.log(g1,g2);
          if(g1 && g2 && font.hkerns[g1] && font.hkerns[g1][g2]){        
              return parseFloat(font.hkerns[g1][g2]);          
          }
          
          var u1 = g.unicode;
          var u2 = ng.unicode;
          // console.log(u1,u2);
          if(font.hkerns[u1] && font.hkerns[u1][u2]){        
              return parseFloat(font.hkerns[u1][u2]);          
          }
          
          if(u1 && u1.substr(0,3) != '&#x'){
              var ux1 = u1.charCodeAt(0).toString(16);
              var c1  = '&#X' + ux1.toUpperCase()+';';            
          }else{
              c1 = u1;
          }
          
          if(u2 && u2.substr(0,3) != '&#x'){
              var ux2 = u2.charCodeAt(0).toString(16);
              var c2 = '&#X' + ux2.toUpperCase()+';';
          }else{
              c2 = u2;
          }
          // console.log(c1,c2);
          if(font.hkerns[c1] && font.hkerns[c1][c2]){        
              return parseFloat(font.hkerns[c1][c2]);          
          }
          // console.log(u1,c2);
          if(font.hkerns[u1] && font.hkerns[u1][c2]){        
              return parseFloat(font.hkerns[u1][c2]);          
          }
          
      }
      
      return hkern;
  }


  return function(itext, callback){

    getFontByName(itext.fontFamily, function(font){
      var glyphs = getGlyphs(itext, font);
      var paths = positionCharPaths(glyphs, itext, font);
      var g = groupCharPaths(paths, itext, font);
      callback(g) 
    });

  }
}());
