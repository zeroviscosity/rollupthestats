(function($, _) {
    'use strict';

    function displayStats() {
        var width = 0.96 * Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (width > 600) width = 600;

        width -= 40; // For padding

        $.get('/api/stats', function(data) {
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

            _.forEach(data, function(prizes, size) {
                var subtotal = _.reduce(_.values(prizes), function(sum, n) { return sum + n; }),
                    frequency = 0,
                    label;

                total += subtotal;

                if (size === 's') label = 'Small';
                else if (size === 'm') label = 'Medium';
                else if (size === 'l') label = 'Large';
                else label = 'Extra Large';

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
