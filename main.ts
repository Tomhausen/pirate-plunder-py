namespace SpriteKind {
    export const treasure = SpriteKind.create()
    export const hitbox = SpriteKind.create()
    export const enemy_projectile = SpriteKind.create()
}

//  variables
let ship_acceleration = 1.5
let turn_speed = 0.2
let speed = 0
let rotation = 0
//  sprites
let ship = sprites.create(assets.image`ship`, SpriteKind.Player)
transformSprites.rotateSprite(ship, 90)
//  setup
tiles.setCurrentTilemap(assets.tilemap`level`)
scene.cameraFollowSprite(ship)
function spawn_treasure(tile: any) {
    let treasure = sprites.create(assets.image`x`, SpriteKind.treasure)
    let hitbox = sprites.create(image.create(47, 47), SpriteKind.hitbox)
    spriteutils.drawCircle(hitbox.image, 24, 24, 20, 1)
    hitbox.setFlag(SpriteFlag.Invisible, true)
    tiles.placeOnTile(treasure, tile)
    tiles.placeOnTile(hitbox, tile)
    sprites.setDataSprite(hitbox, "treasure", treasure)
}

function spawn_fort(tile: any) {
    let fort = sprites.create(assets.image`fort`, SpriteKind.Enemy)
    tiles.placeOnTile(fort, tile)
    let bar = statusbars.create(20, 4, StatusBarKind.EnemyHealth)
    bar.attachToSprite(fort)
}

game.onUpdateInterval(2000, function spawn_loop() {
    let tile: tiles.Location;
    if (sprites.allOfKind(SpriteKind.treasure).length < 10) {
        tile = tilesAdvanced.getAllWallTiles()._pickRandom()
        spawn_treasure(tile)
    }
    
    if (sprites.allOfKind(SpriteKind.Enemy).length < 10) {
        tile = tilesAdvanced.getAllWallTiles()._pickRandom()
        spawn_fort(tile)
    }
    
})
function make_projectile(source: Sprite, kind: number): Sprite {
    let proj = sprites.create(assets.image`cannon ball`, kind)
    proj.setPosition(source.x, source.y)
    proj.lifespan = 1500
    proj.setFlag(SpriteFlag.GhostThroughWalls, true)
    return proj
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function player_fire() {
    let proj: Sprite;
    let angle: number;
    for (let rotation = 0; rotation < 181; rotation += 180) {
        proj = make_projectile(ship, SpriteKind.Projectile)
        angle = transformSprites.getRotation(ship) + rotation
        angle = spriteutils.degreesToRadians(angle)
        spriteutils.setVelocityAtAngle(proj, angle, 100)
    }
})
function enemy_fire(fort: Sprite) {
    let proj: Sprite;
    let angle: number;
    if (randint(1, 100) == 1 && spriteutils.distanceBetween(fort, ship) < 80) {
        proj = make_projectile(fort, SpriteKind.enemy_projectile)
        angle = spriteutils.angleFrom(fort, ship)
        spriteutils.setVelocityAtAngle(proj, angle, 100)
    }
    
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.hitbox, function collect_treasure(ship: Sprite, treasure_hitbox: Sprite) {
    info.changeScoreBy(randint(500, 2000))
    sprites.readDataSprite(treasure_hitbox, "treasure").destroy()
    treasure_hitbox.destroy()
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function hit_fort(fort: Sprite, cannon_ball: Sprite) {
    let bar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, fort)
    bar.value -= 10
    cannon_ball.destroy()
    if (bar.value < 1) {
        spawn_treasure(fort.tilemapLocation())
        fort.destroy()
    }
    
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.enemy_projectile, function player_hit(player: Sprite, cannon_ball: Sprite) {
    info.changeLifeBy(-1)
    cannon_ball.destroy()
    pause(1000)
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Enemy, function fix_double_spawn(enemy: Sprite, other_enemy: Sprite) {
    sprites.allOfKind(SpriteKind.Enemy).pop().destroy()
})
function turn_ship() {
    
    if (controller.left.isPressed()) {
        rotation -= turn_speed
    } else if (controller.right.isPressed()) {
        rotation += turn_speed
    }
    
    rotation *= 0.7
    transformSprites.changeRotation(ship, rotation * speed / 10)
}

function move() {
    
    if (controller.up.isPressed()) {
        speed += ship_acceleration
    } else if (controller.down.isPressed()) {
        speed -= ship_acceleration
    }
    
    speed *= 0.98
    let angle = spriteutils.degreesToRadians(transformSprites.getRotation(ship) - 90)
    spriteutils.setVelocityAtAngle(ship, angle, speed)
}

game.onUpdate(function tick() {
    turn_ship()
    move()
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        enemy_fire(enemy)
    }
})
