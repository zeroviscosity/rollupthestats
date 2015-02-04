(function($) {
    'use strict';

    $('.dropdown').dropdown({
        transition: 'horizontal flip'
    });

    $('#record').click(function() {
        var button = $(this),
            size = $('#size').val(),
            prize = $('#prize').val();
        
        if (size && prize) {
            button.addClass('loading').addClass('disabled');

            console.log(size, prize);
        }
    });

    $('#what-button').click(function() {
        $('#what-modal').modal('show');
    });
})(window.jQuery);
