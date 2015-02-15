(function($, _) {
    'use strict';

    function displayStats() {
        var width = 0.96 * Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            labels = {
                s: 'Small',
                m: 'Medium',
                l: 'Large',
                x: 'Extra Large',
                ab: 'Alberta',
                bc: 'British Columbia',
                mb: 'Manitoba',
                nb: 'New Brunswick',
                nl: 'Newfoundland and Labrador',
                ns: 'Nova Scotia',
                nt: 'Northwest Territories',
                nu: 'Nunavut',
                on: 'Ontario',
                pe: 'Prince Edward Island',
                qc: 'Quebec',
                sk: 'Saskatchewan',
                yt: 'Yukon'
            };

        if (width > 600) width = 600;
        else if (width < 380) {
            labels = {
                s: 'S',
                m: 'M',
                l: 'L',
                x: 'X'
            };
        }

        width -= 40; // For padding

        $.get('/api/stats', function(data) {
            //data = {"sizes":{"s":{"none":434,"coffee":128,"donut":31,"timcard":1,"visa":0,"tv":1,"car":3},"m":{"none":1295,"coffee":382,"donut":153,"timcard":3,"visa":2,"tv":1,"car":5},"l":{"none":789,"coffee":242,"donut":65,"timcard":0,"visa":1,"tv":0,"car":4},"x":{"none":227,"coffee":71,"donut":17,"timcard":1,"visa":0,"tv":0,"car":1}},"provinces":{"ab":{"none":194,"coffee":58,"donut":17,"timcard":0,"visa":0,"tv":0,"car":1},"bc":{"none":79,"coffee":22,"donut":3,"timcard":0,"visa":1,"tv":0,"car":0},"mb":{"none":73,"coffee":25,"donut":7,"timcard":0,"visa":0,"tv":0,"car":0},"nb":{"none":84,"coffee":25,"donut":13,"timcard":0,"visa":0,"tv":0,"car":1},"nl":{"none":3,"coffee":4,"donut":2,"timcard":0,"visa":0,"tv":0,"car":0},"ns":{"none":294,"coffee":70,"donut":21,"timcard":0,"visa":0,"tv":0,"car":0},"nt":{"none":0,"coffee":0,"donut":0,"timcard":0,"visa":0,"tv":0,"car":0},"nu":{"none":2,"coffee":1,"donut":0,"timcard":0,"visa":0,"tv":0,"car":0},"on":{"none":1489,"coffee":456,"donut":152,"timcard":4,"visa":0,"tv":1,"car":8},"pe":{"none":6,"coffee":3,"donut":0,"timcard":0,"visa":0,"tv":0,"car":0},"qc":{"none":84,"coffee":29,"donut":10,"timcard":0,"visa":0,"tv":1,"car":0},"sk":{"none":42,"coffee":1,"donut":2,"timcard":0,"visa":0,"tv":0,"car":0},"yt":{"none":0,"coffee":0,"donut":0,"timcard":0,"visa":0,"tv":0,"car":0}}};
            var frequencies = [],
                rolls = [],
                breakdown = [],
                best = {
                    label: '',
                    value: 0
                },
                most = {
                    label: '',
                    value: 0
                },
                total = 0;

            $('#form').fadeOut(function() {
                $('#stats').css('display', 'inline-block');
            });

            _.forEach(data.sizes, function(prizes, size) {
                var subtotal = _.reduce(_.values(prizes), function(sum, n) { return sum + n; }),
                    frequency = 0,
                    label = labels[size];

                total += subtotal;

                if (subtotal > 0) {
                    frequency = (subtotal - prizes.none) / subtotal;
                }

                frequencies.push({
                    label: label,
                    value: frequency
                });

                rolls.push({
                    label: label,
                    value: subtotal
                });

                prizes.size = label;
                delete prizes.none;
                breakdown.push(prizes);

                if (frequency > best.value) {
                    best.label = label.toLowerCase();
                    best.value = frequency;
                }

                if (subtotal > most.value) {
                    most.label = label.toLowerCase();
                    most.value = subtotal;
                }
            });

            $('#total').html(total);
            $('#best').html(best.label);
            $('#most').html(most.label);

            generateBarChart('#frequency', width, 300, frequencies, 'Frequency', true);
            generateStackedBarChart('#breakdown', width, 300, breakdown);
            generateBarChart('#rolls', width, 300, rolls, 'Rolls Recorded', false);

            d3.xml('/img/canada.svg', 'image/svg+xml', function(xml) {
                var canada = $('#canada'),
                    tooltip = $('<div class="wide tooltip"></div>'),
                    svg = $(xml.documentElement),
                    w = 1043,
                    h = 1010,
                    ratio = h / w,
                    scale = 1.29,
                    provs = [],
                    min = 1,
                    max = 0,
                    interpolate = d3.interpolate('#ffcece', '#d95c5c');

                w *= scale;
                h *= scale;

                svg.attr('width', width + 'px')
                    .attr('height', (width * ratio) + 'px')
                    .attr('viewBox', '0 0 ' + w + ' ' + h)
                    .attr('preserveAspectRatio', 'xMidYMid meet');

                canada.html(svg);
                canada.append(tooltip);

                _.forEach(data.provinces, function(prizes, prov) {
                    var subtotal = _.reduce(_.values(prizes), function(sum, n) { return sum + n; }),
                        frequency = 0,
                        id = '#CA-' + prov.toUpperCase();

                    if (subtotal > 10) {
                        frequency = (subtotal - prizes.none) / subtotal;

                        provs.push({
                            id: id,
                            label: labels[prov],
                            frequency: frequency
                        });

                        if (frequency < min) min = frequency;
                        if (frequency > max) max = frequency;
                    } else {
                        provs.push({
                            id: id,
                            label: labels[prov],
                            frequency: 'N/A'
                        });

                    }
                });

                _.forEach(provs, function(p) {
                    var prov = $(p.id);

                    if (p.frequency !== 'N/A') {
                        prov.attr('fill', interpolate((p.frequency - min) / (max  - min)));
                    }

                    prov.mouseover(function() {
                            var freq = (p.frequency === 'N/A') ?
                                p.frequency :
                                (Math.round(1000 * p.frequency) / 10) + '%';

                            tooltip.html(p.label + '<br>' + freq)
                                .show();
                        })
                        .mouseout(function() {
                            tooltip.hide();
                        })
                        .mousemove(function(evt) {
                            tooltip.css('top', (evt.pageY + 10) + 'px')
                                .css('left', (evt.pageX + 10) + 'px');
                        });
                });
            });
        }, 'json');
    }

    function generateBarChart(id, w, h, data, ylabel, percent) {
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = w - margin.left - margin.right,
            height = h - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left');

        if (percent) {
            yAxis.ticks(10, '%');
        }

        var chart = d3.select(id);

        chart.html('');

        var svg = chart.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var tooltip = chart.append('div')
            .attr('class', 'tooltip');

        x.domain(data.map(function(d) { return d.label; }));
        y.domain([0, d3.max(data, function(d) { return d.value; })]);

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(ylabel);

        var bar = svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', function(d) { return x(d.label); })
            .attr('width', x.rangeBand())
            .attr('y', function(d) { return y(d.value); })
            .attr('height', function(d) { return height - y(d.value); });

        bar.on('mouseover', function(d) {
            if (percent) {
                tooltip.html((Math.round(1000 * d.value) / 10) + '%');
            } else {
                tooltip.html(d.value);
            }
            tooltip.style('display', 'block');
        });

        bar.on('mouseout', function() {
            tooltip.style('display', 'none');
        });

        bar.on('mousemove', function(d) {
            tooltip.style('top', (d3.event.pageY + 10) + 'px')
                .style('left', (d3.event.pageX + 10) + 'px');
        });
    }

    function generateStackedBarChart(id, w, h, data) {
        var margin = {top: 20, right: 110, bottom: 30, left: 40},
            legendRect = 18,
            legendSpacing = 4,
            width = w - margin.left - margin.right,
            height = h - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.1);

        var y = d3.scale.linear()
            .rangeRound([height, 0]);

        var color = d3.scale.ordinal()
            .range(['#d95c5c', '#f3ca2d', '#e07b53', '#564f8a', '#5bbd72', '#3b83c0', '#d9499a', '#00b5ad']);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .tickFormat(d3.format('.0%'));

        var chart = d3.select(id);
        
        chart.html('');

        var svg = chart.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var tooltip = chart.append('div')
            .attr('class', 'tooltip');
                    
        color.domain(d3.keys(data[0]).filter(function(key) { return key !== 'size'; }));

        data.forEach(function(d) {
            var y0 = 0;
            d.prizes = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
            d.prizes.forEach(function(d) { d.y0 /= y0; d.y1 /= y0; });
        });

        x.domain(data.map(function(d) { return d.size; }));

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        var size = svg.selectAll('.size')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'size')
            .attr('transform', function(d) { return 'translate(' + x(d.size) + ',0)'; });

        var rect = size.selectAll('rect')
            .data(function(d) { return d.prizes; })
            .enter()
            .append('rect')
            .attr('width', x.rangeBand())
            .attr('y', function(d) { return y(d.y1); })
            .attr('height', function(d) { return y(d.y0) - y(d.y1); })
            .style('fill', function(d) { return color(d.name); });

        rect.on('mouseover', function(d) {
            tooltip.html((Math.round(1000 * (d.y1 - d.y0)) / 10) + '%');
            tooltip.style('display', 'block');
        });

        rect.on('mouseout', function() {
            tooltip.style('display', 'none');
        });

        rect.on('mousemove', function(d) {
            tooltip.style('top', (d3.event.pageY + 10) + 'px')
                .style('left', (d3.event.pageX + 10) + 'px');
        });

        var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
                var horz = width + 10;
                var vert = i * (legendRect + legendSpacing);
                return 'translate(' + horz + ',' + vert + ')';
            });
        
        legend.append('rect')
            .attr('width', legendRect)
            .attr('height', legendRect)
            .style('fill', color)
            .style('stroke', color);

        legend.append('text')
            .attr('x', legendRect + legendSpacing)
            .attr('y', legendRect - legendSpacing)
            .text(function(d) { 
                if (d === 'coffee') return 'Coffee'; 
                else if (d === 'donut') return 'Donut'; 
                else if (d === 'timcard') return 'Gift Card'; 
                else if (d === 'visa') return 'Prepaid VISA'; 
                else if (d === 'tv') return 'TV'; 
                else return 'Car'; 
            });
    }
    
    $('.dropdown').dropdown({
        transition: 'horizontal flip'
    });

    $('#record').click(function() {
        var button = $(this),
            size = $('#size').val(),
            prize = $('#prize').val(),
            comment = $('#comment').val();
        
        if (size && prize) {
            button.addClass('loading').addClass('disabled');

            $.post('/api/logs', JSON.stringify({
                size: size,
                prize: prize,
                honeypot: comment
            }), function(data) {
                displayStats();
            });
        }
    });

    $('#skip').click(function() {
        $(this).addClass('loading').addClass('disabled');
        displayStats();
    });

    $('#reset').click(function() {
        $('#stats').fadeOut(function() {
            $('#record').removeClass('loading').removeClass('disabled');
            $('#skip').removeClass('loading').removeClass('disabled');
            $('#form').css('display', 'inline-block');
            $('.dropdown').dropdown('clear');
        });
    });

    $('#what-button').click(function() {
        $('#what-modal').modal('show');
    });
})(window.jQuery, window._);
