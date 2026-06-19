export const AVATARS = [
  // Animals — cute
  { id: 'panda',        src: '/avatars/panda.png' },
  { id: 'koala',        src: '/avatars/koala.png' },
  { id: 'polar-bear',   src: '/avatars/polar-bear.png' },
  { id: 'rabbit',       src: '/avatars/rabbit.png' },
  { id: 'cat',          src: '/avatars/cat.png' },
  { id: 'pig',          src: '/avatars/pig.png' },
  { id: 'frog',         src: '/avatars/frog.png' },
  { id: 'penguin',      src: '/avatars/penguin.png' },
  { id: 'fox',          src: '/avatars/fox.png' },
  // Animals — fierce
  { id: 'tiger',        src: '/avatars/tiger.png' },
  { id: 'lion',         src: '/avatars/lion.png' },
  { id: 'trex',         src: '/avatars/trex.png' },
  // Characters
  { id: 'boy',          src: '/avatars/boy.png' },
  { id: 'girl',         src: '/avatars/girl.png' },
  { id: 'unicorn',      src: '/avatars/unicorn.png' },
  // Sports
  { id: 'soccer',       src: '/avatars/soccer.png' },
  { id: 'basketball',   src: '/avatars/basketball.png' },
  { id: 'badminton',    src: '/avatars/badminton.png' },
  { id: 'volleyball',   src: '/avatars/volleyball.png' },
  { id: 'ping-pong',    src: '/avatars/ping-pong.png' },
  { id: 'martial-arts', src: '/avatars/martial-arts.png' },
  // Tech & Adventure
  { id: 'rocket',       src: '/avatars/rocket.png' },
  { id: 'robot',        src: '/avatars/robot.png' },
  { id: 'gamepad',      src: '/avatars/gamepad.png' },
  // Nature & Sweet
  { id: 'rainbow',      src: '/avatars/rainbow.png' },
  { id: 'star',         src: '/avatars/star.png' },
  { id: 'blossom',      src: '/avatars/blossom.png' },
  { id: 'sunflower',    src: '/avatars/sunflower.png' },
  { id: 'butterfly',    src: '/avatars/butterfly.png' },
  { id: 'strawberry',   src: '/avatars/strawberry.png' },
  { id: 'cupcake',      src: '/avatars/cupcake.png' },
  { id: 'ribbon',       src: '/avatars/ribbon.png' },
  { id: 'crystal',      src: '/avatars/crystal.png' },
  // Pop culture
  { id: 'jigglypuff',   src: '/avatars/jigglypuff.png' },
  { id: 'kuromi-1',     src: '/avatars/kuromi-1.png' },
  { id: 'kuromi-2',     src: '/avatars/kuromi-2.png' },
  { id: 'pokeballs',    src: '/avatars/pokeballs.png' },
]

export function getAvatarSrc(id: string): string {
  return AVATARS.find(a => a.id === id)?.src ?? '/avatars/panda.png'
}
