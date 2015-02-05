(function($) {
    'use strict';

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
                console.log(data);
            });
        }
    });

    $.get('/api/stats', function(data) {
        console.log(data);
    });

    $('#what-button').click(function() {
        $('#what-modal').modal('show');
    });
})(window.jQuery);
