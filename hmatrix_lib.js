// Tomi Peltola, tomi.peltola@tmpl.fi
// MIT licence
var d3 = require("d3");

var get_default_options = function() {
  // options, see the opts structure below for details
  var height = 1000;
  var width = 1000;

  var opts = { height: height,
               width: width,
               edge_min_val: 0.0,
               edge_max_val: 1.0,
               edge_offset: 4
             };

  return opts;
}

var compute_indices = function(i) {
  // Get zero based indices from linear indexing of upper triangular matrix.
  // i is along down-right in the figure, j is along down-left.
  var loc_j = Math.floor(0.5 * (1 + Math.sqrt(8 * (i + 1) - 7)));
  var loc_i = i - loc_j * (loc_j - 1) / 2;
  loc_j -= 1;

  return { i: loc_i, j: loc_j };
};

var draw = function(elem, data, opts) {
  var has_edges = data.hasOwnProperty("edges");
  var has_clusters = data.hasOwnProperty("clusters");

  var n_items = data.labels.length;
  var hm_vb = 0.5 * n_items;

  // note: clusters are assumed to be contiguous and in order from 0 to max_clust
  if (has_clusters) {
    var max_cluster = data.clusters[n_items - 1];
  } else {
    var max_cluster = 0;
  }
  var cluster_ofs = 0.25;
  var x_mid = hm_vb + max_cluster * cluster_ofs;

  var svg = d3.select(elem).append("svg")
              .attr('xmlns', 'http://www.w3.org/2000/svg')
              .attr("width", opts.width)
              .attr("height", opts.height)
              .attr("viewBox", "-0.25 -0.5 " + (2 * hm_vb + 2 + (max_cluster + 1) * cluster_ofs) + " " + (2 * hm_vb + 2.25 + (max_cluster + 1) * cluster_ofs));

  // add css
  var svg_style = svg.append("defs")
                     .append('style')
                     .attr('type','text/css');

  var css_text = "<![CDATA[ \
      svg { \
        background-color: #fff; \
        font-size: 0.5px; \
      } \
      polygon { \
        stroke: #555; \
        stroke-width: 0.05; \
      } \
      .line { \
        fill: none; \
        stroke: #555; \
        stroke-width: 0.1; \
      } \
      .nodes { \
        stroke: #000; \
        stroke-width: 0.5; \
      } \
  ]]> ";

  svg_style.text(css_text);

  var hm_cs = d3.scale.quantize().domain(data.value_domain).range(data.value_colors);

  var hm_points = function(d, i) {
    loc = compute_indices(i);

    var top_x = x_mid - 0.5 * (loc.j + 1) + loc.i * 0.5;
    var top_y = loc.j * 0.5 + loc.i * 0.5 + 0.5;

    return "" + top_x + "," + top_y + " " + (top_x - 0.5) + "," + (top_y + 0.5) + " " + top_x + "," + (top_y + 1) + " " + (top_x + 0.5) + "," + (top_y + 0.5);
  };

  var hm_ident = function(d, i) {
    loc = compute_indices(i);
    return "n" + (loc.j + 1) + " n" + loc.i;
  };

  var line = d3.svg.line()
                   .x(function(d) { return d[0]; })
                   .y(function(d) { return d[1]; })
                   .interpolate("bundle")
                   .tension(1.0);

  if (has_clusters) {
    var label_cluster_trans = function(d, i) {
      return "translate(0," + (2 * (data.clusters[i] -  1) * cluster_ofs) + ")";
    };
    var hm_cluster_trans = function(d, i) {
      loc = compute_indices(i);

      var diff_clust = Math.abs(data.clusters[loc.i] - data.clusters[loc.j + 1]);

      var trans_y = (2 * (data.clusters[loc.i] -  1) + diff_clust) * cluster_ofs;
      var trans_x = -(diff_clust * cluster_ofs);
      return "translate(" + trans_x + "," + trans_y + ")";
    };
    var edge_cluster_y_offset = function(i) {
      return 2 * (data.clusters[i] -  1) * cluster_ofs;
    };
  } else {
    var label_cluster_trans = function(d, i) {
      return "";
    };
    var hm_cluster_trans = function(d, i) {
      return "";
    };
    var edge_cluster_y_offset = function(i) {
      return 0;
    };
  }

  var edge_path = function(d) {
    var c = 0.7;
    var from_y_ofs = edge_cluster_y_offset(d["from"]);
    var to_y_ofs = edge_cluster_y_offset(d["to"]);
    var len = (x_mid - opts.edge_offset) * Math.abs(d["from"] - d["to"]) / (n_items - 1);
    var dat = [[x_mid + opts.edge_offset, d["from"] + from_y_ofs + 0.5],
               [x_mid + opts.edge_offset + c * len, d["from"] + from_y_ofs + 0.5],
               [x_mid + opts.edge_offset + len, 0.5 * (d["from"] + d["to"] + from_y_ofs + to_y_ofs + 1)],
               [x_mid + opts.edge_offset + c * len, d["to"] + to_y_ofs + 0.5],
               [x_mid + opts.edge_offset, d["to"] + to_y_ofs + 0.5]];
    return line(dat);
  };


  var hm = svg.append("g").attr("id", "heatmap")
                          .selectAll("polygon")
                          .data(data.values)
                          .enter()
                          .append("polygon")
                          .attr("points", hm_points)
                          .attr("transform", hm_cluster_trans)
                          .attr("fill", hm_cs)
                          .attr("class", hm_ident)
                          .on("mouseover", function(d, i) {
                            loc = compute_indices(i);
                            svg.select("text.l" + loc.i + "").style({ "font-weight": "bold" });
                            svg.select("text.l" + (loc.j + 1) + "").style({ "font-weight": "bold" });
                          })
                          .on("mouseout", function(d, i) {
                            loc = compute_indices(i);
                            svg.select("text.l" + loc.i + "").style({ "font-weight": "normal" });
                            svg.select("text.l" + (loc.j + 1) + "").style({ "font-weight": "normal" });
                          });

  var labels = svg.append("g").selectAll("text")
                              .data(data.labels)
                              .enter()
                              .append("text")
                              .attr("x", x_mid)
                              .attr("y", function(d, i) { return i + 0.5; })
                              .attr("transform", label_cluster_trans)
                              .attr("dominant-baseline", "central")
                              .text(function (d) { return d; })
                              .attr("class", function(d, i) { return "l" + i; })
                              .on("mouseover", function(d, i) {
                                d3.select(this).style({ "font-weight": "bold" });
                                svg.selectAll("#heatmap polygon:not(.n" + i + ")").style({ "opacity": 0.2 });
                                svg.selectAll("path:not(.e" + i + ")").style({ "visibility": "hidden" });
                              })
                              .on("mouseout", function(d, i) {
                                d3.select(this).style({ "font-weight": "normal" });
                                svg.selectAll("#heatmap polygon:not(.n" + i + ")").style({ "opacity": 1 });
                                svg.selectAll("path:not(.e" + i + ")").style({ "visibility": "visible" });
                              });

  if (has_edges) {
    var edges = svg.append("g").selectAll("path")
                               .data(data.edges)
                               .enter()
                               .append("path")
                               .attr("opacity", function(d) { return (d["value"] - opts.edge_min_val) / (opts.edge_max_val - opts.edge_min_val); })
                               .attr("d", edge_path)
                               .attr("class", function(d) {
                                 return "line e" + d["from"] + " e" + d["to"];
                               })
                               .on("mouseover", function(d, i) {
                                 svg.selectAll("#heatmap polygon:not(.n" + d["from"] + ")").style({ "opacity": 0.2 });
                                 svg.selectAll("#heatmap polygon:not(.n" + d["to"] + ")").style({ "opacity": 0.2 });
                                 svg.select("text.l" + d["from"] + "").style({ "font-weight": "bold" });
                                 svg.select("text.l" + d["to"] + "").style({ "font-weight": "bold" });
                               })
                               .on("mouseout", function(d, i) {
                                 svg.selectAll("#heatmap polygon:not(.n" + d["from"] + ")").style({ "opacity": 1.0 });
                                 svg.selectAll("#heatmap polygon:not(.n" + d["to"] + ")").style({ "opacity": 1.0 });
                                 svg.select("text.l" + d["from"] + "").style({ "font-weight": "normal" });
                                 svg.select("text.l" + d["to"] + "").style({ "font-weight": "normal" });
                               });
  }

  // add colorbar (TODO: see if it fits in all cases)
  if (data.value_colors.length < (n_items + 1)) {
    var cbar_points = function(d, i) {
      var loc = { i: 0, j: i + Math.round(0.5 * (n_items - data.value_colors.length)) };

      var top_x = x_mid - 0.5 * (loc.j + 1) + loc.i * 0.5;
      var top_y = loc.j * 0.5 + loc.i * 0.5 + 0.5;

      return "" + top_x + "," + top_y + " " + (top_x - 0.5) + "," + (top_y + 0.5) + " " + top_x + "," + (top_y + 1) + " " + (top_x + 0.5) + "," + (top_y + 0.5);
    };
    var cbar_text_x = function(d, i) {
      return x_mid - 0.5 * (i * (data.value_colors.length + 1) + Math.round(0.5 * (n_items - data.value_colors.length)));
    };
    var cbar_text_y = function(d, i) {
      return 0.5 * (i * (data.value_colors.length + 1) + Math.round(0.5 * (n_items - data.value_colors.length))) + 0.5;
    };
    var cbar_text_transform = function(d, i) {
      var x = x_mid - 0.5 * (i * (data.value_colors.length + 1) + Math.round(0.5 * (n_items - data.value_colors.length)));
      var y = 0.5 * (i * (data.value_colors.length + 1) + Math.round(0.5 * (n_items - data.value_colors.length))) + 0.5;
      return "translate(" + (-2) + ", 0),rotate(-45 " + x + "," + y + ")";
    };

    var cbar = svg.append("g");
    cbar.selectAll("polygon")
        .data(data.value_colors)
        .enter()
        .append("polygon")
        .attr("points", cbar_points)
        .attr("transform", "translate(" + (-2) + ", 0)")
        .attr("fill", function(d) { return d; });
    cbar.selectAll("text")
        .data(data.value_domain)
        .enter()
        .append("text")
        .attr("x", cbar_text_x)
        .attr("y", cbar_text_y)
        .attr("transform", cbar_text_transform)
        .attr("dominant-baseline", "central")
        .attr("text-anchor", function(d, i) { if (i == 0) return "start"; else return "end"; })
        .text(function (d) { return Math.round(100 * d) / 100; });
  }
};

exports.get_default_options = get_default_options;
exports.draw = draw;
