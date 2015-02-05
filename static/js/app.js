(function($, _) {
    'use strict';

    function displayStats() {
        var width = 0.96 * Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (width > 600) width = 600;

        $.get('/api/stats', function(data) {
            var frequencies = [],
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
                    frequency: frequency
                });
            });

            $('#total').html(total);
            $('#frequency').empty();
        
            generateFrequencyChart(width, 300, frequencies);
        }, 'json');
    }

    function generateFrequencyChart(width, height, data) {
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = width - margin.left - margin.right,
            height = height - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(10, '%');

        var svg = d3.select('#frequency').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        x.domain(data.map(function(d) { return d.label; }));
        y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

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
            .text('Frequency');

        svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', function(d) { return x(d.label); })
            .attr('width', x.rangeBand())
            .attr('y', function(d) { return y(d.frequency); })
            .attr('height', function(d) { return height - y(d.frequency); });
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
        });
    });

    $('#what-button').click(function() {
        $('#what-modal').modal('show');
    });
})(window.jQuery, window._);
