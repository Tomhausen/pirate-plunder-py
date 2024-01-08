namespace SpriteKind {
    export const treasure = SpriteKind.create()
    export const hitbox = SpriteKind.create()
    export const enemy_projectile = SpriteKind.create()
    export const port = SpriteKind.create()
    export const pool = SpriteKind.create()
}

// 
//  variables
let ship_acceleration = 1.5
let turn_speed = 0.2
let speed = 0
let rotation = 0
let treasure_onboard = 0
let minimap_open = false
// 
//  sprites
let ship = sprites.create(assets.image`ship`, SpriteKind.Player)
transformSprites.rotateSprite(ship, 90)
let whirlpool : Sprite = null
//  setup
tiles.setCurrentTilemap(assets.tilemap`level`)
scene.cameraFollowSprite(ship)
//  text
let treasure_text = textsprite.create("" + treasure_onboard, 3, 0)
treasure_text.z = 10
treasure_text.setFlag(SpriteFlag.RelativeToCamera, true)
//  minimap
let minimap_object = minimap.minimap(MinimapScale.Eighth, 2, 15)
// 
let minimap_image = minimap.getImage(minimap_object)
// 
let minimap_sprite = sprites.create(minimap_image)
// 
minimap_sprite.z = 10
// 
minimap_sprite.setFlag(SpriteFlag.RelativeToCamera, true)
// 
minimap_sprite.setFlag(SpriteFlag.Invisible, true)
// 
function update_text() {
    treasure_text.setText("" + treasure_onboard)
    treasure_text.right = 160
    treasure_text.bottom = 120
}

update_text()
function make_ports() {
    let port: Sprite;
    let port_hitbox: Sprite;
    let tile: tiles.Location;
    for (let i = 0; i < 3; i++) {
        port = sprites.create(assets.image`settlement`, SpriteKind.port)
        port_hitbox = sprites.create(image.create(47, 47), SpriteKind.port)
        spriteutils.drawCircle(port_hitbox.image, 24, 24, 20, 1)
        port_hitbox.setFlag(SpriteFlag.Invisible, true)
        tile = tilesAdvanced.getAllWallTiles()._pickRandom()
        tiles.placeOnTile(port, tile)
        tiles.placeOnTile(port_hitbox, tile)
        sprites.setDataSprite(port_hitbox, "treasure", port)
        tiles.setWallAt(tile, false)
    }
}

make_ports()
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
game.onUpdateInterval(20000, function spawn_whirlpool() {
    
    whirlpool = sprites.create(assets.image`whirlpool`, SpriteKind.pool)
    tiles.placeOnRandomTile(whirlpool, assets.tile`water`)
    whirlpool.lifespan = 10000
    whirlpool.z = -1
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
        for (let aim = -15; aim < 16; aim += 15) {
            proj = make_projectile(ship, SpriteKind.Projectile)
            angle = transformSprites.getRotation(ship) + rotation + aim
            angle = spriteutils.degreesToRadians(angle)
            spriteutils.setVelocityAtAngle(proj, angle, 100)
        }
    }
})
controller.B.onEvent(ControllerButtonEvent.Pressed, function toggle_map() {
    // 
    
    if (minimap_open) {
        minimap_sprite.setFlag(SpriteFlag.Invisible, true)
        minimap_open = false
    } else {
        minimap_sprite.setFlag(SpriteFlag.Invisible, false)
        minimap_open = true
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
    
    treasure_onboard += randint(500, 2000)
    update_text()
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
sprites.onOverlap(SpriteKind.Player, SpriteKind.port, function sell_treasure(ship: Sprite, port: Sprite) {
    
    info.changeScoreBy(treasure_onboard)
    treasure_onboard = 0
    update_text()
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.enemy_projectile, function player_hit(player: Sprite, cannon_ball: Sprite) {
    info.changeLifeBy(-1)
    cannon_ball.destroy()
    pause(1000)
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Enemy, function fix_double_spawn(enemy: Sprite, other_enemy: Sprite) {
    sprites.allOfKind(SpriteKind.Enemy).pop().destroy()
})
game.onUpdateInterval(100, function update_minimap() {
    let minimap_object: minimap.Minimap;
    // 
    if (minimap_open) {
        minimap_object = minimap.minimap(MinimapScale.Eighth, 2, 15)
        minimap.includeSprite(minimap_object, ship, MinimapSpriteScale.Double)
        for (let treasure of sprites.allOfKind(SpriteKind.treasure)) {
            minimap.includeSprite(minimap_object, treasure, MinimapSpriteScale.Double)
        }
        for (let fort of sprites.allOfKind(SpriteKind.Enemy)) {
            minimap.includeSprite(minimap_object, fort, MinimapSpriteScale.Double)
        }
        for (let port of sprites.allOfKind(SpriteKind.port)) {
            minimap.includeSprite(minimap_object, port, MinimapSpriteScale.Double)
        }
        minimap_sprite.setImage(minimap.getImage(minimap_object))
    }
    
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

function handle_whirlpool() {
    if (spriteutils.distanceBetween(ship, whirlpool) < 100) {
        ship.vx += Math.sign(whirlpool.x - ship.x) * 15
        ship.vy += Math.sign(whirlpool.y - ship.y) * 15
    }
    
    transformSprites.changeRotation(whirlpool, 1)
}

game.onUpdate(function tick() {
    turn_ship()
    move()
    handle_whirlpool()
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        enemy_fire(enemy)
    }
})
