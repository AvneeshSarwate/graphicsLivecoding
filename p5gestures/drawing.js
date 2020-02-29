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

function drawing(){
    clear();
    let simpleCells = simplifyCells(voronoiStructure);
    fill(255);
    simpleCells.forEach(cell => {
        beginShape();
        cell.forEach(pt => vertex(pt[0], pt[1]))
        endShape();
    });
}