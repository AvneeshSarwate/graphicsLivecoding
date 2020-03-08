console.log("drawing.js eval");

function simplifyCells(voronoiDiagram){
    var cells = [];
    for (var i = 0; i < voronoiDiagram.cells.length; i++) {
        var vertices = [];
        for (var j = 0; j < voronoiDiagram.cells[i].halfedges.length; j++) {
            vertices.push([voronoiDiagram.cells[i].halfedges[j].getStartpoint().x, voronoiDiagram.cells[i].halfedges[j].getStartpoint().y]);
        }
        cells.push(vertices);
    }
    return cells;
}

function orderedEdges(cell){
    var vertices = [];
    for (var j = 0; j < cell.halfedges.length; j++) {
        vertices.push([cell.halfedges[j].getStartpoint().x, cell.halfedges[j].getStartpoint().y]);
    }
    return vertices
}
var newTime = 10;
function drawing(){
    clear();
    strokeWeight(20);
    sliders[0] = 0.3;
    sliders[1] = 0.04;
    sliders[3] = 1;
    
    voronoiRefSites(time).forEach((s, i, a) => {
        let s2 = voronoiSites[i];
        s2.x = s.x + Math.sin(time * (1 + rand(i)))*0;
        s2.y = s.y + Math.cos(time * (1 + rand(i)))*0; 
    });

    try{
        voronoiStructure = voronoi.compute(voronoiSites, bbox);
    } catch(err){
        console.log("VORONOI ERROR", err);
    }
    fill(255);
    voronoiSites.forEach((site, i) => {
        // // if(rand(i) < 0.25) return;
        // let cell = voronoiStructure.cells[site.voronoiId];
        // fill(rand(i)*255, rand(i+.1)*255, rand(i+.2)*255)
        let siteAnim = voronoiSiteAnimations[i];
        let val = siteAnim.next();
        if(val.value) voronoiDrawFuncs[i] = val.value;
        voronoiDrawFuncs[i]();

        noFill();
        beginShape();
        getSimplifiedPoints(i).forEach(pt => vertex(pt[0], pt[1]))
        endShape(CLOSE);
    });
}