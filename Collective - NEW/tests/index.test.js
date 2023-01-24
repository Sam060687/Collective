// const $ = require('jquery');

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '../views/index.ejs'), 'utf8');

jest
    .dontMock('fs');

describe('index', () => {
    it('should have a title', () => {
        expect(html).toMatch(/Collective/);
    });

    // it('should add a friend', () => {
    //     $('#submitAddFriend').click();
    //     expect(html).toMatch(/Add Friend/);
    // })
}); 