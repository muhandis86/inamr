import Util from 'bootstrap/js/src/util';
import 'bootstrap/js/dist/modal';

global.Util = Util;
export default class Modal {
    constructor(container) {
        this.container = container || $('.jsModalVideo');
        this.iframe = this.container.find('.modal-video__iframe');
        this.container.on('hide.bs.modal', () => this.iframe.html(''));
    }

    show(element) {
        let video = this.setVideo(element);

        if (!video) return;

        this.container.modal('show');
        setTimeout(() => this.iframe.html(video).hide().fadeIn(1000), 600);
    }

    hide() {
        this.container.modal('hide');
        this.iframe.html('');
    }

    setVideo(element) {
        let source = element.data('src'),
            html = '<iframe class="iframe-youtube" width="100%" height="100%" src="' + source +
                '?autoplay=1&controls=2&showinfo=0" frameborder="0" allowfullscreen></iframe>';

        if (!source) {
            console.error('Не удалось получить источник для видео');
            return false;
        }
        return html;
    }
}
